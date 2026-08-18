import { createStore } from "./state.js";
import { post } from "./nui.js";

const MESSAGE_TIMEOUT = 20000;
const INPUT_TIMEOUT = 2500;

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

export function clearChat() {
    s.messages = {};
    chat.emit();
}

export function addMessage(message) {
    s.messages[message.keyValue] = message;
    if (message.removeMessage) setTimeout(() => dropMessage(message.keyValue), MESSAGE_TIMEOUT);
    if (inputMessageTimedOut) clearTimeout(inputMessageTimedOut);
    inputMessageTimedOut = false;
    if (lastMessageTimedOut) clearTimeout(lastMessageTimedOut);
    s.areMessagesVisible = true;
    lastMessageTimedOut = setTimeout(onMessagesTimeout, MESSAGE_TIMEOUT);
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

export function setInputVisible(state) {
    s.isInputVisible = state;
    chat.emit();
    post("chat.inputVisibilityState", { state: s.isInputVisible });
}

export function setMessagesAreVisible(state) {
    if (lastMessageTimedOut) return;
    if (!state && s.areMessagesVisible) {
        if (inputMessageTimedOut) clearTimeout(inputMessageTimedOut);
        inputMessageTimedOut = setTimeout(onInputTimeout, INPUT_TIMEOUT);
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
