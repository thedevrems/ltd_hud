import { el, setText, setClass, animate } from "../core/dom.js";
import { config } from "../core/config.js";
import { post } from "../core/nui.js";
import {
    chat, setInputVisible, setHistoryIndex, addToHistory, applyHistoryIndex, getHistory
} from "../core/chatstore.js";

const EASING = "cubic-bezier(0.075, 0.82, 0.165, 1)";
const MAX_SUGGESTIONS = 5;
const SHOW_DURATION = 400;
const ENTER_DURATION = 800;
const LEAVE_DURATION = 400;
const MARGIN = ".2vw";

let root = null;
let input = null;
let ghost = null;
let list = null;
let shown = {};
let suggestionValue = "";
const nodes = new Map();

function bare(command) {
    return config.state.Chat.UseCommandsWithoutSyntax ? command.slice(1) : command;
}

// Shortest command first, then alphabetically, capped at five entries.
function matching(prefix) {
    return Object.keys(chat.state.suggestions)
        .filter(command => bare(command).toLowerCase().startsWith(prefix.toLowerCase()))
        .sort((a, b) => bare(a).length !== bare(b).length
            ? bare(a).length - bare(b).length
            : bare(a).localeCompare(bare(b)))
        .slice(0, MAX_SUGGESTIONS);
}

function collect(commands) {
    const picked = {};
    commands.forEach(command => {
        const entry = Object.assign({}, chat.state.suggestions[command]);
        if (config.state.Chat.UseCommandsWithoutSyntax) entry.command = entry.command.slice(1);
        picked[command] = entry;
    });
    return picked;
}

function handleInput(event) {
    const value = event.target.value;
    if (!config.state.Chat.UseCommandsWithoutSyntax && value.charAt(0) !== "/") {
        suggestionValue = "";
        shown = {};
        return renderSuggestions();
    }
    shown = collect(matching(value.split(" ")[0]));
    const first = Object.keys(shown)[0];
    suggestionValue = value.length === 0 || !first ? "" : shown[first].command;
    renderSuggestions();
}

function buildSuggestion(entry) {
    const node = el("div", "suggestion");
    const row = el("div", "row");
    const name = el("div", "command-name");
    setText(name, entry.command ? entry.command : "");
    row.appendChild(name);
    Object.values(entry.params || {}).forEach(param => {
        const chip = el("div", "params");
        setText(chip, param.name);
        row.appendChild(chip);
    });
    node.appendChild(row);
    if (!entry.info) return node;
    const info = el("div", "command-info");
    setText(info, entry.info);
    node.appendChild(info);
    return node;
}

function enterSuggestion(node) {
    const height = node.getBoundingClientRect().height / window.innerWidth * 100 + "vw";
    animate(node, [
        { opacity: 0, height: "0vw", transform: "translateX(-10%)", marginTop: "0", marginBottom: "0" },
        { opacity: 1, height, transform: "translateX(0)", marginTop: MARGIN, marginBottom: MARGIN }
    ], { duration: ENTER_DURATION, easing: EASING });
}

function leaveSuggestion(node) {
    const height = node.getBoundingClientRect().height / window.innerWidth * 100 + "vw";
    const animation = animate(node, [
        { opacity: 1, height, transform: "translateX(0)", marginTop: MARGIN, marginBottom: MARGIN },
        { opacity: 0, height: "0vw", transform: "translateX(10%)", marginTop: "0", marginBottom: "0" }
    ], { duration: LEAVE_DURATION, easing: EASING });
    if (animation) animation.onfinish = () => node.remove();
    else node.remove();
}

function dropMissingSuggestions() {
    [...nodes.keys()].forEach(command => {
        if (shown[command]) return;
        leaveSuggestion(nodes.get(command));
        nodes.delete(command);
    });
}

function renderSuggestions() {
    if (!list) return;
    setText(ghost, suggestionValue);
    dropMissingSuggestions();
    Object.keys(shown).forEach(command => {
        if (nodes.has(command)) return;
        const node = buildSuggestion(shown[command]);
        nodes.set(command, node);
        list.appendChild(node);
        enterSuggestion(node);
    });
    setClass(list, "active", Object.keys(shown).length > 0);
}

// Enter closes the input, releases NUI focus and forwards the raw text to Lua.
function submit() {
    const text = input.value;
    root.focus();
    input.value = null;
    post("base.handleFocus", { state: false });
    post("chatResult", { text });
    if (text.length > 0) {
        addToHistory(text);
        setHistoryIndex(-1);
    }
    setInputVisible(false);
}

function recallHistory(event, older) {
    input.value = getHistory(applyHistoryIndex(older));
    event.preventDefault();
}

function handleKeydown(event) {
    if (event.key === "Tab") {
        event.preventDefault();
        input.value = suggestionValue;
    }
    if (event.key === "ArrowUp") return recallHistory(event, true);
    if (event.key === "ArrowDown") return recallHistory(event, false);
    if (event.key === "Enter") submit();
}

export function showInput(state) {
    suggestionValue = "";
    setHistoryIndex(-1);
    const frames = state
        ? [{ opacity: 0, transform: "translateX(-10%)" }, { opacity: 1, transform: "translateX(0)" }]
        : [{ opacity: 1, transform: "translateX(0)" }, { opacity: 0, transform: "translateX(10%)" }];
    const animation = animate(root.querySelector(".chat-input"), frames, {
        duration: SHOW_DURATION, easing: EASING
    });
    if (animation) animation.onfinish = () => { if (state) input.focus(); };
    else if (state) input.focus();
}

export function resetInput() {
    input.value = null;
    shown = {};
    renderSuggestions();
}

export function applyPlaceholder() {
    input.placeholder = config.state.Chat.Translate.enter_message || "";
}

export function mountInput(container) {
    root = container;
    input = container.querySelector(".chat-input-proper");
    ghost = container.querySelector(".message-input-content-bg");
    list = container.querySelector(".chat-input .suggestions");
    input.addEventListener("input", handleInput);
    input.addEventListener("keydown", handleKeydown);
    applyPlaceholder();
}
