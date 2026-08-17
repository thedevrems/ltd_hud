import { el, clear, setText, setClass } from "./dom.js";

function listElement(key, entry, selected, onChange) {
    const node = el("div", "list-element");
    node.onclick = () => onChange(key);
    if (!entry.use) return node;
    const wrapper = el("div", "convert-list-element");
    const text = el("div", "text");
    setText(text, entry.label);
    setClass(text, "active", selected === entry.label);
    wrapper.appendChild(text);
    node.appendChild(wrapper);
    return node;
}

function toggleBox(widget) {
    widget.isActive = !widget.isActive;
    setClass(widget.root, "active", widget.isActive);
    setClass(widget.list, "active", widget.isActive);
}

// The welcome variant picker: a rounded card whose list unrolls underneath.
export function createSelectBox(onChange) {
    const root = el("div", "select-box");
    const header = el("div", "header");
    const overflow = el("div", "overflow-override");
    const row = el("div", "row");
    const label = el("div", "selected-element");
    const chevron = el("div", "hovered-off");
    const list = el("div", "list");
    chevron.appendChild(el("i", "fas fa-chevron-up"));
    row.append(label, chevron);
    overflow.append(row, list);
    root.append(header, overflow);
    const widget = { root, list, isActive: false };
    row.onclick = () => {
        toggleBox(widget);
        setClass(chevron, "active", widget.isActive);
    };
    widget.setHeader = value => setText(header, value);
    widget.update = (entries, selected) => {
        setText(label, selected);
        clear(list);
        Object.keys(entries).forEach(key => list.appendChild(listElement(key, entries[key], selected, onChange)));
    };
    return widget;
}

// Square tick whose inner block scales in once the option is enabled.
export function createWelcomeCheckbox(onChange) {
    const root = el("div", "checkbox-content");
    const label = el("div", "label");
    const box = el("div", "pre-check");
    const check = el("div", "check");
    box.appendChild(check);
    root.append(label, box);
    const widget = { root, state: false };
    box.onclick = () => onChange(!widget.state);
    widget.setLabel = value => setText(label, value);
    widget.update = (state, disabled) => {
        widget.state = !!state;
        setClass(check, "active", widget.state);
        setClass(root, "disabled", !!disabled);
    };
    return widget;
}

function dragWelcomeRange(widget, event) {
    if (!widget.dragging) return;
    const rect = widget.track.getBoundingClientRect();
    const percent = (event.clientX - rect.left) / rect.width * 100;
    widget.onChange(Math.min(Math.max(percent, 0), 100));
}

export function createWelcomeRange(onChange) {
    const root = el("div", "range config");
    const header = el("div", "text");
    const track = el("div", "range-progress-parent");
    const fill = el("div", "range-progress-value");
    const handle = el("div", "progress-mouse-handle");
    track.append(fill, handle);
    root.append(header, track);
    const widget = { root, track, onChange, dragging: false };
    const move = event => dragWelcomeRange(widget, event);
    const up = () => { widget.dragging = false; };
    handle.onmousedown = () => { widget.dragging = true; };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
    widget.setHeader = value => setText(header, value);
    widget.update = (value, disabled) => {
        fill.style.width = value - 1 + "%";
        setClass(root, "disabled", !!disabled);
    };
    return widget;
}

// Native swatch sized up for the theme step of the customisation flow.
export function createWelcomeColorPicker(onChange, onClose) {
    const root = el("div", "color-picker-content customize");
    const input = el("input", "color-picker", { type: "color" });
    input.oninput = event => onChange(event.target.value);
    input.onchange = event => onClose(event.target.value);
    root.appendChild(input);
    return { root, update: value => { input.value = value; } };
}
