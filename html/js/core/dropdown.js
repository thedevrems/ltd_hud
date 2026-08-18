import { el, clear, setText, setClass } from "./dom.js";
import sfx from "./sfx.js";

function chevron() {
    const icon = el("i", "fas fa-chevron-down");
    icon.style.pointerEvents = "none";
    return icon;
}

function listElement(entry, selected, onChange) {
    const node = el("div", "select-list-element");
    const text = el("div", "text");
    setText(text, entry.label);
    node.appendChild(text);
    setClass(node, "active", entry.name === selected);
    node.onclick = () => {
        sfx.click.play();
        onChange(entry.name);
    };
    return node;
}

function renderList(list, entries, selected, onChange) {
    clear(list);
    entries.forEach(entry => list.appendChild(listElement(entry, selected, onChange)));
}

function toggleDropdown(widget) {
    if (widget.disabled) return;
    widget.isActive = !widget.isActive;
    applyOpenState(widget);
}

function applyOpenState(widget) {
    const open = widget.disabled ? false : widget.isActive;
    setClass(widget.button, "active", open);
    setClass(widget.list, "active", open);
}

// Only entries the server left enabled reach the Selection list.
function usableEntries(elements) {
    return Object.values(elements || {}).filter(entry => entry.use);
}

// Wide dropdown used to pick the interface variant of a component.
export function createSelection(onChange) {
    const root = el("div", "select config selection");
    const header = el("div", "header");
    const content = el("div", "selected-content");
    const label = el("div", "selected-label");
    const button = el("div", "dropdown-button");
    const list = el("div", "select-list");
    button.appendChild(chevron());
    content.append(label, button);
    root.append(header, content, list);
    const widget = { root, button, list, isActive: false, disabled: false };
    content.onclick = () => toggleDropdown(widget);
    widget.setHeader = value => setText(header, value);
    widget.update = (elements, selected, text) => {
        setText(label, text);
        renderList(list, usableEntries(elements), selected, onChange);
        applyOpenState(widget);
    };
    return widget;
}

// Compact dropdown used for option values such as the enter animation.
export function createSmallSelect(onChange) {
    const root = el("div", "select config small-select");
    const content = el("div", "selected-content");
    const textContent = el("div", "text-content");
    const header = el("div", "header");
    const label = el("div", "selected-label");
    const button = el("div", "dropdown-button");
    const icon = el("div", "icon");
    const list = el("div", "select-list");
    icon.appendChild(chevron());
    button.appendChild(icon);
    textContent.append(header, label);
    content.append(textContent, button);
    root.append(content, list);
    const widget = { root, button, list, isActive: false, disabled: false };
    content.onclick = () => toggleDropdown(widget);
    widget.setHeader = value => setText(header, value);
    widget.setDisabled = state => applyDisabled(widget, state);
    widget.update = (elements, selected, text) => {
        setText(label, text);
        renderList(list, Object.values(elements || {}), selected, onChange);
        applyOpenState(widget);
    };
    return widget;
}

function applyDisabled(widget, state) {
    widget.disabled = !!state;
    setClass(widget.root, "disabled", widget.disabled);
    applyOpenState(widget);
}
