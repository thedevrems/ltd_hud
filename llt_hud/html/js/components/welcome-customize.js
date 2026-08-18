import { el, svgEl, setText } from "../core/dom.js";
import { register as registerScreen, current, push, subscribe } from "../core/screens.js";
import { createCustomization } from "./welcome-customization.js";
import { createNavbar } from "./welcome-navbar.js";
import { BACKGROUND_PATH, BACKGROUND_GRADIENT } from "./welcome-backdrop.js";
import { config } from "../core/config.js";
import { language, ui } from "../core/i18n.js";
import { game } from "../core/gamestore.js";
import sfx from "../core/sfx.js";

const PATH = "/welcome/customize";
const OUTLET = ".customize-view";
const CHILD_KIT = "customization-transition";
const CHILDREN = [
    { path: "color", element: "theme", label: "color_picker", icon: "fas fa-fill" },
    { path: "hud", element: "hud", label: "hud", icon: "fas fa-heart" },
    { path: "carhud", element: "carhud", label: "carhud", icon: "fas fa-car" },
    { path: "notifications", element: "notifications", label: "notification", icon: "fas fa-car" },
    { path: "helpnotify", element: "helpNotify", label: "help_notify", icon: "fas fa-car", key: "helpNotify" },
    { path: "progressbar", element: "progressBar", label: "progress_bar", icon: "fas fa-car", key: "progressBar" }
];

let navbar = null;
let screens = [];

function backdrop() {
    const box = el("div", "preset-background");
    const svg = svgEl("svg", { viewBox: "0 0 1920 1080", fill: "none" });
    svg.appendChild(svgEl("path", BACKGROUND_PATH));
    svg.appendChild(BACKGROUND_GRADIENT());
    box.appendChild(svg);
    return box;
}

function headerRow(spec) {
    const row = el("div", "header-row");
    const box = el("div", "header-box");
    spec.header = el("div", "header");
    spec.text = el("div", "text");
    box.append(spec.header, spec.text);
    row.append(el("div", "line"), box);
    return row;
}

function buildChild(spec) {
    const root = el("div", "content customize-content");
    const block = createCustomization(spec.element);
    root.append(backdrop(), headerRow(spec), block.root);
    registerScreen(PATH + "/" + spec.path, root);
    return Object.assign({}, spec, { root, block });
}

// Interfaces the server disabled drop out of the flow entirely.
function usableChildren() {
    const interfaces = config.state.UI.Interfaces;
    return screens.filter(child => {
        const entry = interfaces[child.key || child.path];
        return !entry || entry.use;
    });
}

function activeChild() {
    return current().startsWith(PATH + "/") ? current().slice(PATH.length + 1) : "";
}

function renderChild(child) {
    setText(child.header, ui("welcome." + child.label + ".header"));
    setText(child.text, ui("welcome." + child.label + ".text"));
    child.block.render();
}

function render() {
    const list = usableChildren();
    const path = activeChild();
    if (!path) return;
    navbar.render(list.map(child => ({ path: child.path, icon: iconOf(child) })), path);
    const child = list.find(entry => entry.path === path);
    if (child) renderChild(child);
}

function iconOf(child) {
    const entry = config.state.UI.Interfaces[child.key || child.path];
    return entry && entry.icon ? entry.icon : child.icon;
}

// Landing on the parent opens the first interface the server left enabled.
function onRouteChanged(to, from) {
    if (to === PATH) {
        const first = usableChildren()[0];
        return first && push(PATH + "/" + first.path);
    }
    if (!to.startsWith(PATH + "/")) return;
    if (from !== to && from.startsWith(PATH)) playStepSfx();
    render();
}

function playStepSfx() {
    sfx.woosh2.play();
    sfx.soft_woosh.play();
}

// The "/welcome/customize" route: the guided interface customisation flow.
export function register() {
    const root = el("div", "customize-content");
    const outlet = el("div", "customize-view");
    navbar = createNavbar();
    root.append(outlet, navbar.root);
    registerScreen(PATH, root, OUTLET, CHILD_KIT);
    screens = CHILDREN.map(buildChild);
    subscribe(onRouteChanged);
    [game, config, language].forEach(store => store.subscribe(() => { if (activeChild()) render(); }));
    onRouteChanged(current(), current());
}
