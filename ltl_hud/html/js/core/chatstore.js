import { createStore } from "./state.js";
import { config } from "./config.js";
import { post } from "./nui.js";

// Combien de temps un message marqué `removeMessage` reste dans la réserve. Sans
// rapport avec la visibilité du panneau : celui-ci s'efface de lui-même, celui-là
// disparaît de la liste.
const DROP_TIMEOUT = 20000;

export const chat = createStore("chat", {
    messages: {},
    suggestions: {},
    isInputVisible: false,
    areMessagesVisible: false,
    historyIndex: -1,
    history: []
});

const s = chat.state;
let lastMessageTimedOut = false;
let inputMessageTimedOut = false;

// Un écran fondu au noir ou le menu pause. Bloque toute réapparition tant qu'il
// tient : revenir d'un fondu ne doit pas rejouer une rafale déjà manquée.
let forcedHidden = false;

// Le délai d'affichage vient du Lua (Config.Chat.VisibleMs) ; la valeur ici n'est
// que ce que la page utilise entre son premier rendu et l'arrivée de la config.
function visibleMs() {
    const value = config.state.Chat && config.state.Chat.VisibleMs;
    return Number.isFinite(value) && value > 0 ? value : 8000;
}

export function clearChat() {
    s.messages = {};
    chat.emit();
}

export function addMessage(message) {
    s.messages[message.keyValue] = message;
    if (message.removeMessage) setTimeout(() => dropMessage(message.keyValue), DROP_TIMEOUT);
    if (inputMessageTimedOut) clearTimeout(inputMessageTimedOut);
    inputMessageTimedOut = false;
    if (lastMessageTimedOut) clearTimeout(lastMessageTimedOut);
    // LE COMPTEUR REPART DE ZÉRO à chaque ligne : dix lignes en rafale laissent le
    // tchat visible ce délai après la dernière, pas après la première.
    s.areMessagesVisible = !forcedHidden;
    lastMessageTimedOut = setTimeout(onMessagesTimeout, visibleMs());
    chat.emit();
}

function dropMessage(key) {
    if (!s.messages[key]) return;
    delete s.messages[key];
    chat.emit();
}

// The timer stays armed while the input holds the pool open.
function onMessagesTimeout() {
    if (s.isInputVisible) return;
    lastMessageTimedOut = false;
    s.areMessagesVisible = false;
    chat.emit();
}

// L'écran s'est fondu au noir, ou le menu pause s'est ouvert. On masque tout de
// suite ET on reste masqué : la fenêtre ne doit peindre ni par-dessus un écran de
// chargement ni par-dessus le menu échap.
export function setForcedHidden(state) {
    forcedHidden = state === true;
    if (!forcedHidden) return;
    if (lastMessageTimedOut) clearTimeout(lastMessageTimedOut);
    if (inputMessageTimedOut) clearTimeout(inputMessageTimedOut);
    lastMessageTimedOut = false;
    inputMessageTimedOut = false;
    s.areMessagesVisible = false;
    chat.emit();
}

export function isForcedHidden() {
    return forcedHidden;
}

export function setInputVisible(state) {
    s.isInputVisible = state;
    chat.emit();
    post("chat.inputVisibilityState", { state: s.isInputVisible });
}

export function setMessagesAreVisible(state) {
    if (forcedHidden) return;
    if (lastMessageTimedOut) return;
    if (!state && s.areMessagesVisible) {
        // La saisie se referme : on réarme le fondu qu'elle retenait.
        if (inputMessageTimedOut) clearTimeout(inputMessageTimedOut);
        inputMessageTimedOut = setTimeout(onInputTimeout, visibleMs());
        return;
    }
    s.areMessagesVisible = state;
    chat.emit();
}

function onInputTimeout() {
    inputMessageTimedOut = false;
    s.areMessagesVisible = false;
    chat.emit();
}

// MaxPoolSize evictions hand the dropped message back to Lua verbatim.
export function trimPool(max) {
    const keys = Object.keys(s.messages);
    if (!max || keys.length <= max) return null;
    const key = keys[0];
    post("chat.poolSizeMessageRemoved", s.messages[key]);
    delete s.messages[key];
    return key;
}

// Un staff a pris ou rendu son service. La réserve est mise à jour pour qu'un
// message remonté plus tard porte l'état courant ; le repeint de ce qui est
// DÉJÀ à l'écran se fait dans chat.js, qui possède les nœuds.
export function setStaffDuty(uuid, onDuty) {
    let changed = false;
    Object.values(s.messages).forEach(message => {
        if (!message.staff || message.staff.uuid !== uuid) return;
        message.staff.onDuty = onDuty;
        changed = true;
    });
    if (changed) chat.emit();
}

export function addSuggestion(entry) {
    s.suggestions[entry.command] = entry;
    chat.emit();
}

export function removeSuggestion(entry) {
    if (!s.suggestions[entry.command]) return;
    delete s.suggestions[entry.command];
    chat.emit();
}

export function removeAllSuggestions() {
    s.suggestions = {};
    chat.emit();
}

// Remplace la moitié de la liste qui vient du serveur et laisse intactes les
// entrées enregistrées par les ressources.
//
// `fromServer` est ce qui permet à un rafraîchissement de ne supprimer que ses
// propres entrées : une entrée de ressource porte l'aide et les paramètres là où
// la moitié recalculée n'a qu'un nom, donc c'est la ressource qui l'emporte, et
// la perdre à chaque ouverture serait perdre tout ce qu'elle documentait.
export function setServerSuggestions(list) {
    Object.keys(s.suggestions).forEach(command => {
        if (s.suggestions[command].fromServer) delete s.suggestions[command];
    });
    (Array.isArray(list) ? list : []).forEach(entry => {
        if (!entry || typeof entry.command !== "string") return;
        if (s.suggestions[entry.command]) return;
        s.suggestions[entry.command] = { command: entry.command, params: {}, info: "", fromServer: true };
    });
    chat.emit();
}

export function setHistoryIndex(value) {
    s.historyIndex = value;
}

export function addToHistory(value) {
    s.history.push(value);
}

// Arrow keys walk the history, clamped at both ends.
export function applyHistoryIndex(older) {
    if (older) s.historyIndex = s.history.length - 1 > s.historyIndex ? s.historyIndex + 1 : s.history.length - 1;
    else if (s.historyIndex !== -1) s.historyIndex--;
    return s.historyIndex;
}

export function getHistory(index) {
    const reversed = s.history.slice().reverse();
    return reversed[index] ? reversed[index] : "";
}
