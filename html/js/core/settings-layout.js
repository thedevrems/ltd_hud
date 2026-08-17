import { el, setStyle, enterTransition, leaveTransition } from "./dom.js";
import { register as registerScreen, current, subscribe } from "./screens.js";
import { ui } from "./i18n.js";

const PREVIEW_KIT = "clippath";

export function header(styles) {
    const node = el("div", "header");
    if (styles) setStyle(node, styles);
    return node;
}

export function spacer(marginBottom) {
    const node = el("div");
    node.style.marginBottom = marginBottom;
    return node;
}

function buildColumns(content, count, dividers) {
    const columns = [];
    for (let index = 0; index < count; index++) {
        if (index) {
            const divider = el("div", "game-menu-line");
            dividers.push(divider);
            content.appendChild(divider);
        }
        const column = el("div", "column");
        columns.push(column);
        content.appendChild(column);
    }
    return columns;
}

// Every settings child shares this shell: columns, dividers and a live preview.
export function createSettingsScreen(id, path, options) {
    const root = document.getElementById(id);
    const content = el("div", "settings-content");
    const dividers = [];
    const columns = buildColumns(content, options.columns, dividers);
    root.appendChild(content);
    const preview = options.preview === false ? null : el("div", previewClass(options));
    if (preview) root.appendChild(preview);
    registerScreen(path, root);
    return { root, columns, dividers, preview };
}

function previewClass(options) {
    return options.previewScale ? "content-preview " + options.previewScale : "content-preview";
}

// The preview swaps variants through the build's clippath transition.
export function swapPreview(preview, node) {
    const previous = preview.firstElementChild;
    if (previous) leaveTransition(previous, PREVIEW_KIT, () => previous.remove());
    if (!node) return;
    preview.appendChild(node);
    enterTransition(node, PREVIEW_KIT);
}

// Router children only rendered while mounted; idle screens must stay inert.
export function bindScreenRender(path, render, stores) {
    const update = () => { if (current() === path) render(); };
    stores.forEach(store => store.subscribe(update));
    subscribe(update);
    update();
}

export function animationList(names) {
    const list = {};
    names.forEach(name => { list[name] = { name, label: ui("game_menu.animations." + name) }; });
    return list;
}

export function labelFor(list, selected) {
    return list[selected] ? list[selected].label : selected;
}

// Interface entries start from the built-in table, then the server config wins.
export function interfaceList(defaults, types) {
    const list = {};
    Object.keys(defaults).forEach(name => {
        const base = defaults[name];
        const entry = types && types[name];
        list[name] = { name, use: entry ? entry.use : base.use, label: entry ? entry.label : base.label };
    });
    return list;
}
