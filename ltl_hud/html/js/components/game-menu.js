import { el, clear, setText } from "../core/dom.js";
import { register as registerScreen, replace, current, subscribe } from "../core/screens.js";
import { config } from "../core/config.js";
import { language, ui } from "../core/i18n.js";
import { post } from "../core/nui.js";
import sfx from "../core/sfx.js";

const FORWARD_KEYS = ["ArrowRight", "ArrowDown"];
const BACKWARD_KEYS = ["ArrowLeft", "ArrowUp"];

function item(name, label, icon) {
    return { name, label, icon, use: true };
}

const DEFAULT_ITEMS = {
    color: item("color", "Couleurs", "fas fa-fill"),
    hud: item("hud", "HUD", "fas fa-heart"),
    carhud: item("carhud", "Véhicule", "fas fa-car"),
    notifications: item("notifications", "Notifications", "fas fa-envelope-open"),
    progressBar: item("progressBar", "Barre de progression", "fas fa-circle-notch"),
    helpNotify: item("helpNotify", "Notification d'aide", "fas fa-question-circle"),
    misc: item("misc", "Divers", "fas fa-cogs"),
    positioning: item("position", "Position", "fas fa-arrows-alt")
};

let screen = null;
let navbar = null;
let header = null;
let items = {};
let tabs = [];
let selectedIndex = 0;
let isMounted = false;

// The server config only overrides the label, icon and visibility of a tab.
function buildItems() {
    items = {};
    for (const key in DEFAULT_ITEMS) items[key] = Object.assign({}, DEFAULT_ITEMS[key]);
    const interfaces = config.state.UI.Interfaces || {};
    for (const key in interfaces) {
        const entry = interfaces[key];
        const target = items[entry.name];
        if (!target) continue;
        Object.assign(target, { label: entry.label, icon: entry.icon, use: entry.use });
    }
}

function visibleItems() {
    return Object.values(items).filter(entry => entry.use);
}

function pathOf(entry) {
    return entry.name === "position" ? "/position" : "/menu/" + entry.name;
}

function isCurrent(entry) {
    if (entry.name === "position") return current().includes("/position");
    return current() === pathOf(entry).toLowerCase();
}

function buildTab(entry) {
    const node = el("a", "navbar-item");
    const icon = el("div", "icon");
    icon.appendChild(el("i", entry.icon));
    node.appendChild(icon);
    const text = el("div", "text");
    setText(text, entry.label);
    node.appendChild(text);
    node.onclick = () => {
        sfx.wind.play();
        replace(pathOf(entry));
    };
    return node;
}

function renderNavbar() {
    clear(navbar);
    tabs = visibleItems().map(entry => ({ entry, node: buildTab(entry) }));
    tabs.forEach(tab => navbar.appendChild(tab.node));
    applyActive();
}

function applyActive() {
    tabs.forEach(tab => tab.node.classList.toggle("active", isCurrent(tab.entry)));
}

function renderHeader() {
    clear(header);
    const span = el("span");
    setText(span, ui("game_menu.navbar.interface_options.options"));
    header.appendChild(document.createTextNode(ui("game_menu.navbar.interface_options.interface") + " "));
    header.appendChild(span);
}

// Arrows cycle the visible tabs and swap the route without stacking history.
function onArrowNavigation(event) {
    if (!isMounted) return;
    const entries = visibleItems();
    const last = entries.length - 1;
    if (FORWARD_KEYS.includes(event.key)) selectedIndex = selectedIndex + 1 > last ? 0 : selectedIndex + 1;
    else if (BACKWARD_KEYS.includes(event.key)) selectedIndex = selectedIndex - 1 < 0 ? last : selectedIndex - 1;
    else return;
    replace(pathOf(entries[selectedIndex]));
    sfx.wind.play();
}

function onRouteChanged(to) {
    const inside = to.startsWith("/menu");
    applyActive();
    if (inside === isMounted) return;
    isMounted = inside;
    post("gamemenu.handleCamera", { state: inside });
    if (!inside) return;
    selectedIndex = 0;
    screen.focus();
}

// The "/menu" shell: header, interface tabs and the outlet its children mount in.
export function register() {
    screen = document.getElementById("game-menu-screen");
    navbar = screen.querySelector(".navbar-items");
    header = screen.querySelector(".header");
    screen.addEventListener("keydown", onArrowNavigation);
    registerScreen("/menu", screen, ".game-menu-list-parent");
    buildItems();
    renderHeader();
    renderNavbar();
    config.subscribe(() => {
        buildItems();
        renderNavbar();
    });
    language.subscribe(renderHeader);
    subscribe(onRouteChanged);
}
