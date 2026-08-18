import { el, setText } from "../core/dom.js";

function iconBox(icon) {
    const box = el("div", "icon");
    box.appendChild(el("i", icon || "fas fa-envelope"));
    return box;
}

function progressValue() {
    return el("div", "value");
}

// Basic lays the label over the bar, to the right of the icon badge.
function buildBasic(data) {
    const root = el("div", "progressbar progressbar-basic");
    const progress = el("div", "progress");
    const text = el("div", "text");
    setText(text, data.text);
    const value = progressValue();
    progress.append(text, value);
    root.append(iconBox(data.icon), progress);
    return { root, value };
}

// Modern stacks the bar above the label in a column next to the icon.
function buildModern(data) {
    const root = el("div", "progressbar progressbar-modern");
    const column = el("div", "column");
    const progress = el("div", "progress");
    const value = progressValue();
    progress.appendChild(value);
    const text = el("div", "text");
    setText(text, data.text);
    column.append(progress, text);
    root.append(iconBox(data.icon), column);
    return { root, value };
}

// Diamond rotates the bar behind the icon and floats the label beside it.
function buildDiamond(data) {
    const root = el("div", "progressbar progressbar-diamond");
    const progress = el("div", "progress");
    const value = progressValue();
    progress.append(iconBox(data.icon), value);
    const text = el("div", "text");
    setText(text, data.text);
    root.append(progress, text);
    return { root, value };
}

export const VARIANTS = {
    basic: buildBasic,
    modern: buildModern,
    diamond: buildDiamond
};
