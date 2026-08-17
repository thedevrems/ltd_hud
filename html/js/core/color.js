import { el, setText, setClass } from "./dom.js";

const NEAR_BLACK = 100;

export function convertHexToRGBA(hex, alpha) {
    const red = parseInt(hex.substr(1, 2), 16);
    const green = parseInt(hex.substr(3, 2), 16);
    const blue = parseInt(hex.substr(5, 2), 16);
    return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

// Euclidean distance from pure black decides whether the label stays readable.
export function isNearBlack(hex) {
    const red = parseInt(hex.substr(1, 2), 16);
    const green = parseInt(hex.substr(3, 2), 16);
    const blue = parseInt(hex.substr(5, 2), 16);
    return Math.sqrt(red ** 2 + green ** 2 + blue ** 2) <= NEAR_BLACK;
}

function buildLabel(options) {
    if (!options.icon && !options.text) return null;
    const box = el("div", "icon");
    if (options.icon) box.appendChild(el("i", options.icon));
    else setText(box, options.text);
    return box;
}

function buildInput(options) {
    const input = el("input", "pickr", { type: "color" });
    input.oninput = event => options.onChange(event.target.value);
    input.onchange = event => options.onClose(event.target.value);
    return input;
}

// Native colour swatch overlaid by the icon or the label of the entry.
export function createColorPicker(options) {
    const root = el("div", "color-picker");
    const content = el("div", "picker-content");
    const input = buildInput(options);
    const box = buildLabel(options);
    content.appendChild(input);
    if (box) content.appendChild(box);
    root.appendChild(content);
    setClass(root, "full", options.full);
    return {
        root,
        update(current, disabled) {
            input.value = current;
            input.style.background = current;
            setClass(root, "disable", disabled);
            if (box && !options.icon) box.style.color = isNearBlack(current) ? "white" : "black";
        }
    };
}
