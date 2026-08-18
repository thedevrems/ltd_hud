import { setClass, animate } from "../core/dom.js";
import { config } from "../core/config.js";
import { game } from "../core/gamestore.js";
import { post } from "../core/nui.js";
import { setEscapeGuard } from "../core/screens.js";
import {
    chat, addMessage, clearChat, addSuggestion, removeSuggestion, removeAllSuggestions,
    setInputVisible, setMessagesAreVisible, trimPool
} from "../core/chatstore.js";
import { buildMessage } from "./chat-message.js";
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
    setClass(messages, "active", chat.state.areMessagesVisible || chat.state.isInputVisible);
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

function registerHandlers(bus) {
    bus.on("CHAT_ADD_MESSAGE", data => addMessage(data));
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
