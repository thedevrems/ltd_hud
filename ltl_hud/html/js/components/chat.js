import { setClass, animate } from "../core/dom.js";
import { config } from "../core/config.js";
import { game } from "../core/gamestore.js";
import { post } from "../core/nui.js";
import { setEscapeGuard } from "../core/screens.js";
import {
    chat, addMessage, clearChat, addSuggestion, removeSuggestion, removeAllSuggestions,
    setInputVisible, setMessagesAreVisible, trimPool, setForcedHidden, setStaffDuty,
    setServerSuggestions, isForcedHidden
} from "../core/chatstore.js";
import { buildMessage, paintDuty } from "./chat-message.js";
import { mountInput, showInput, resetInput, applyPlaceholder } from "./chat-input.js";

const EASING = "cubic-bezier(0.075, 0.82, 0.165, 1)";
const ENTER_DURATION = 800;
const LEAVE_DURATION = 400;

let host = null;
let messages = null;
let animating = 0;
let wasInputVisible = false;
const nodes = new Map();

function toVw(pixels) {
    return pixels / window.innerWidth * 100 + "vw";
}

// Every entry lands scrolled into view once its animation settles.
function onAllEntered() {
    if (animating !== 0 || !messages) return;
    messages.scrollTo({ top: messages.scrollHeight });
}

function enterMessage(node) {
    const height = node.getBoundingClientRect().height;
    animating++;
    messages.scrollTo({ top: messages.scrollHeight + height, behavior: "smooth" });
    const animation = animate(node, [
        { opacity: 0, height: "0vw", transform: "translateX(-10%)" },
        { opacity: 1, height: toVw(height), transform: "translateX(0)" }
    ], { duration: ENTER_DURATION, easing: EASING });
    const done = () => {
        animating--;
        onAllEntered();
    };
    if (animation) animation.onfinish = done;
    else done();
}

function leaveMessage(node) {
    const height = toVw(node.getBoundingClientRect().height);
    const animation = animate(node, [
        { opacity: 1, height, transform: "translateX(0)" },
        { opacity: 0, height: "0vw", transform: "translateX(10%)" }
    ], { duration: LEAVE_DURATION, easing: EASING });
    if (animation) animation.onfinish = () => node.remove();
    else node.remove();
}

function mountMessage(key, message) {
    const node = buildMessage(message);
    node.style.opacity = 0;
    node.style.transform = "translateX(-10%)";
    nodes.set(key, node);
    messages.appendChild(node);
}

function dropMissing(list) {
    [...nodes.keys()].forEach(key => {
        if (list[key]) return;
        leaveMessage(nodes.get(key));
        nodes.delete(key);
    });
}

function renderMessages() {
    const list = chat.state.messages;
    const fresh = Object.keys(list).filter(key => !nodes.has(key));
    fresh.forEach(key => mountMessage(key, list[key]));
    if (fresh.length) trimPool(config.state.Chat.MaxPoolSize);
    dropMissing(chat.state.messages);
    fresh.forEach(key => {
        if (nodes.has(key)) enterMessage(nodes.get(key));
    });
}

function applyVisibility() {
    // Le masquage forcé bat la saisie ouverte : un fondu au noir ou le menu pause
    // ne doit rien laisser peindre par-dessus, quel que soit l'état du tchat.
    const visible = (chat.state.areMessagesVisible || chat.state.isInputVisible) && !isForcedHidden();
    setClass(messages, "active", visible);
    host.style.display = config.state.Chat.Use ? "" : "none";
}

function applyScale() {
    const size = game.state.misc.options.chat_size;
    setClass(host, "scale-15", size === "medium");
    setClass(host, "scale-2", size === "big");
}

// CHAT_SET_INPUT_VISIBLE and Escape both funnel through this transition.
function watchInputVisible() {
    if (chat.state.isInputVisible === wasInputVisible) return;
    wasInputVisible = chat.state.isInputVisible;
    if (!wasInputVisible) resetInput();
    showInput(wasInputVisible);
    setMessagesAreVisible(wasInputVisible);
}

function render() {
    if (!host) return;
    renderMessages();
    applyVisibility();
    watchInputVisible();
}

// Escape closes the input before the router gets a chance to navigate.
function escapeGuard() {
    if (!chat.state.isInputVisible) return false;
    post("base.handleFocus", { state: false });
    setInputVisible(false);
    return true;
}

// Un staff a pris ou rendu son service. On repeint chaque ligne de lui encore à
// l'écran, pour que la pastille énonce un fait courant plutôt que celui qui
// tenait quand la ligne a été tapée.
//
// On parcourt les nœuds montés et on compare, plutôt que de construire un
// sélecteur `[data-staff="…"]` : un uuid est une donnée serveur, mais un
// sélecteur assemblé à partir d'une valeur reste un analyseur nourri d'une
// chaîne, et il n'y a aucune raison d'ouvrir cette porte pour une boucle sur au
// plus quelques dizaines de nœuds.
function repaintDuty(uuid, onDuty) {
    setStaffDuty(uuid, onDuty);
    nodes.forEach(node => {
        if (node.dataset.staff !== uuid) return;
        const pill = node.querySelector(".duty");
        if (pill) paintDuty(pill, onDuty);
    });
}

function registerHandlers(bus) {
    bus.on("CHAT_ADD_MESSAGE", data => addMessage(data));
    bus.on("CHAT_FORCE_HIDE", data => setForcedHidden(data.hidden));
    bus.on("CHAT_DUTY_CHANGE", data => repaintDuty(data.uuid, data.onDuty === true));
    bus.on("CHAT_SET_SERVER_SUGGESTIONS", data => setServerSuggestions(data.suggestions));
    bus.on("CHAT_ADD_SUGGESTION", data => addSuggestion(data));
    bus.on("CHAT_REMOVE_SUGGESTION", data => removeSuggestion(data));
    bus.on("CHAT_REMOVE_ALL_SUGGESTIONS", () => removeAllSuggestions());
    bus.on("CHAT_SET_INPUT_VISIBLE", data => setInputVisible(data.state));
    bus.on("CLEAR_CHAT", () => clearChat());
}

export function register(bus) {
    host = document.getElementById("chat-content");
    messages = host.querySelector(".chat-messages");
    mountInput(host);
    registerHandlers(bus);
    setEscapeGuard(escapeGuard);
    chat.subscribe(render);
    game.subscribe(applyScale);
    config.subscribe(() => {
        applyPlaceholder();
        applyScale();
        render();
    });
    render();
    applyScale();
}
