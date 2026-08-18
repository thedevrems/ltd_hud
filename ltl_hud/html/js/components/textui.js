import { el, setText, setClass, setHTML } from "../core/dom.js";
import {
    perspective, addTextUIElement, updateTextUI, removeTextUIElement
} from "../core/perspectivestore.js";

const KEY_OVERLAY = '<svg viewBox="0 0 48 50" fill="none" xmlns="http://www.w3.org/2000/svg">' +
    '<path d="M15.1818 9H7V43H17" class="stroke-keybind-key" stroke-width="2"></path>' +
    '<path d="M15.1818 9H7V43H17" class="stroke-keybind-key" stroke-width="2"></path>' +
    '<path d="M33.6364 43H41V9H32" class="stroke-keybind-key" stroke-width="2"></path>' +
    '<path d="M33.6364 43H41V9H32" class="stroke-keybind-key" stroke-width="2"></path>' +
    '<path d="M26.5981 0.5L24 5L21.4019 0.5H26.5981Z" class="fill-keybind-key"></path>' +
    '<path d="M26.5981 0.5L24 5L21.4019 0.5H26.5981Z" class="stroke-keybind-key"></path>' +
    '<path d="M26.5981 0.5L24 5L21.4019 0.5H26.5981Z" class="stroke-keybind-key"></path></svg>';

let host = null;
const nodes = new Map();

function buildProgress() {
    const wrapper = el("div", "progress");
    const value = el("div", "value");
    wrapper.appendChild(value);
    return { wrapper, value };
}

function buildKeyBadge(keyText) {
    const badge = el("div", "key-bg");
    const overlay = el("div", "key-overlay");
    setHTML(overlay, KEY_OVERLAY);
    badge.append(overlay, keyText);
    return badge;
}

// Timed entries carry a draining bar; permanent ones show the label alone.
function buildEntry(entry) {
    const root = el("div", "keybind");
    const column = el("div", "column");
    const background = el("div", "bg");
    const text = el("div", "text");
    const keyText = el("div", "text");
    background.appendChild(text);
    column.appendChild(background);
    const progress = entry.duration > 0 ? buildProgress() : null;
    if (progress) column.appendChild(progress.wrapper);
    root.append(column, buildKeyBadge(keyText));
    return { root, text, keyText, value: progress ? progress.value : null };
}

function updateEntry(node, entry) {
    setClass(node.root, "active", entry.visible);
    setClass(node.root, "done", entry.done);
    setText(node.text, entry.text);
    setText(node.keyText, entry.key);
    if (node.value) node.value.style.width = entry.progress + "%";
}

function dropMissing(list) {
    [...nodes.keys()].forEach(serial => {
        if (list[serial]) return;
        nodes.get(serial).root.remove();
        nodes.delete(serial);
    });
}

function render() {
    if (!host) return;
    const list = perspective.state.textui_list;
    dropMissing(list);
    Object.keys(list).forEach(serial => {
        if (!nodes.has(serial)) {
            const node = buildEntry(list[serial]);
            nodes.set(serial, node);
            host.appendChild(node.root);
        }
        updateEntry(nodes.get(serial), list[serial]);
    });
}

export function register(bus) {
    host = document.getElementById("keybinds-content");
    bus.on("ADD_TEXT_UI_ELEMENT", data => addTextUIElement(data.serial, data.key, data.text, data.duration));
    bus.on("UPDATE_TEXT_UI_ELEMENT", data => updateTextUI(data.serial, data.key, data.value));
    bus.on("REMOVE_TEXT_UI_ELEMENT", data => removeTextUIElement(data.serial, data.anim));
    perspective.subscribe(render);
    render();
}
