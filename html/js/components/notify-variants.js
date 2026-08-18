import { el, setText, setHTML } from "../core/dom.js";
import { transformUsingRegex } from "../core/format.js";

function progressBar(duration, vertical) {
    const wrapper = el("div", "progress");
    const value = el("div", "value value-progress");
    value.style[vertical ? "height" : "width"] = duration === -1 ? "100%" : "0%";
    wrapper.appendChild(value);
    return wrapper;
}

function iconBox(icon, className) {
    const box = el("div", className || "icon");
    box.appendChild(el("i", icon));
    return box;
}

function textBlock(text, centered) {
    const node = el("div", centered ? "text centerized" : "text");
    setHTML(node, transformUsingRegex(text));
    return node;
}

function headerBlock(header) {
    const node = el("div", "header");
    setText(node, header);
    return node;
}

// Basic stacks a row of icon plus header above the text.
function buildBasic(data, options) {
    const root = el("div", "notify-basic");
    if (options.smoothEdges) root.classList.add("smoothEdges");
    root.appendChild(progressBar(data.duration, true));
    if (data.header && data.icon && data.text) {
        const row = el("div", "row");
        row.append(iconBox(data.icon), headerBlock(data.header));
        root.append(row, textBlock(data.text));
    } else if (data.header && data.text) {
        root.append(headerBlock(data.header), textBlock(data.text));
    } else if (data.text) {
        root.appendChild(textBlock(data.text, true));
    }
    return root;
}

// Modern and default share their markup and differ only by class.
function buildInline(className, data, options) {
    const root = el("div", className);
    if (options.smoothEdges) root.classList.add("smoothEdges");
    root.appendChild(progressBar(data.duration, false));
    if (data.header && data.icon && data.text) {
        const col = el("div", "col");
        col.append(headerBlock(data.header), textBlock(data.text));
        root.append(iconBox(data.icon), col);
    } else if (data.header && data.text) {
        const col = el("div", "col");
        col.append(headerBlock(data.header), textBlock(data.text));
        root.appendChild(col);
    } else if (data.text) {
        root.appendChild(textBlock(data.text, true));
    }
    return root;
}

function diamondIcon(data) {
    const box = el("div", "icon");
    if (data.icon) {
        const converted = el("div", "converted-icon");
        converted.appendChild(el("i", data.icon));
        box.appendChild(converted);
    }
    const value = el("div", "value-progress progress-value");
    value.style.width = data.duration === -1 ? "100%" : "0%";
    box.appendChild(value);
    return box;
}

// Diamond carries its progress inside the icon badge.
function buildDiamond(data, options) {
    const root = el("div", "notify-diamond");
    if (options.smoothEdges) root.classList.add("smoothEdges");
    if (data.header && data.text) {
        const col = el("div", "col");
        col.append(headerBlock(data.header), textBlock(data.text));
        root.append(diamondIcon(data), col);
    } else if (data.text) {
        root.append(diamondIcon(data), textBlock(data.text, true));
    }
    return root;
}

export const VARIANTS = {
    basic: buildBasic,
    modern: (data, options) => buildInline("notify-modern", data, options),
    default: (data, options) => buildInline("notify-default", data, options),
    diamond: buildDiamond
};
