import { el, svgEl, clear, setText, setClass } from "./dom.js";

const CHECK_PATH = "M3 26C3 26 17.0179 11.9821 26 3M3 3L26 26";
const CHECK_ATTRS = { d: CHECK_PATH, stroke: "white", "stroke-opacity": "0.15", "stroke-width": "6" };

function checkboxSvg() {
    const svg = svgEl("svg", { class: "checkboxsvg", viewBox: "0 0 30 30", fill: "none" });
    svg.appendChild(svgEl("path", CHECK_ATTRS));
    return svg;
}

// A cross that rotates into a tick once the option is enabled.
export function createCheckbox(text, onUpdate) {
    const root = el("div", "checkbox config");
    const label = el("div", "text-content");
    setText(label, text);
    const box = el("div", "true-false-content");
    const svg = checkboxSvg();
    box.appendChild(svg);
    root.append(label, box);
    const widget = { root, svg, onUpdate, state: false, disabled: false };
    widget.setText = value => setText(label, value);
    widget.update = (state, disabled) => updateCheckbox(widget, state, disabled);
    box.onclick = () => toggleCheckbox(widget);
    return widget;
}

function toggleCheckbox(widget) {
    if (widget.disabled) return;
    widget.state = !widget.state;
    setClass(widget.svg, "active", widget.state);
    widget.onUpdate(widget.state);
}

// The build's updated() hook forced a disabled checkbox back off; keep that.
function updateCheckbox(widget, state, disabled) {
    widget.disabled = !!disabled;
    widget.state = !!state;
    setClass(widget.root, "disable", widget.disabled);
    if (widget.state && widget.disabled) {
        widget.state = false;
        widget.onUpdate(false);
    }
    setClass(widget.svg, "active", widget.state);
}

function rangeTexts(root) {
    const indicator = el("div", "range-texts-indicator");
    const minimal = el("div", "text");
    const maximal = el("div", "text");
    indicator.append(minimal, maximal);
    root.appendChild(indicator);
    return { minimal, maximal };
}

// Slider driven by the pointer position inside its own track.
export function createRange(onChange, withTexts) {
    const root = el("div", "range config");
    const texts = withTexts === false ? null : rangeTexts(root);
    const track = el("div", "range-progress-parent");
    const fill = el("div", "range-progress-value");
    const handle = el("div", "progress-mouse-handle");
    track.append(fill, handle);
    root.appendChild(track);
    const widget = { root, track, onChange, dragging: false };
    widget.onMove = event => dragRange(widget, event);
    widget.onUp = () => stopRange(widget);
    widget.setValue = value => { fill.style.width = value - 1 + "%"; };
    widget.setDisabled = state => setClass(root, "disabled", state);
    widget.setTexts = (minimal, maximal) => applyRangeTexts(texts, minimal, maximal);
    handle.onmousedown = () => startRange(widget);
    return widget;
}

function applyRangeTexts(texts, minimal, maximal) {
    if (!texts) return;
    setText(texts.minimal, minimal);
    setText(texts.maximal, maximal);
}

function startRange(widget) {
    widget.dragging = true;
    window.addEventListener("mousemove", widget.onMove);
    window.addEventListener("mouseup", widget.onUp);
}

function stopRange(widget) {
    if (!widget.dragging) return;
    widget.dragging = false;
    window.removeEventListener("mousemove", widget.onMove);
    window.removeEventListener("mouseup", widget.onUp);
}

function dragRange(widget, event) {
    if (!widget.dragging) return;
    const rect = widget.track.getBoundingClientRect();
    const percent = (event.clientX - rect.left) / rect.width * 100;
    widget.onChange(Math.min(Math.max(percent, 0), 100));
}

function visibilityHandler(entry, onUpdate) {
    const node = el("div", "component-handler");
    const icon = el("div", "icon");
    icon.appendChild(el("i", entry.icon));
    node.appendChild(icon);
    setClass(node, "active", entry.isVisible);
    node.onclick = () => onUpdate(entry.name, !entry.isVisible);
    return node;
}

// The status toggles pinned under the hud interface selector.
export function createComponentVisibility(onUpdate) {
    const root = el("div", "components-visibility");
    const header = el("div", "text");
    const row = el("div", "row");
    root.append(header, row);
    return {
        root,
        setHeader: value => setText(header, value),
        update(components) {
            clear(row);
            Object.values(components).forEach(entry => row.appendChild(visibilityHandler(entry, onUpdate)));
        }
    };
}
