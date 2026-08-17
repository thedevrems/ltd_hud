import { el, setText, setClass } from "../core/dom.js";
import { register as registerScreen, current, subscribe } from "../core/screens.js";
import { createRange } from "../core/widgets.js";
import { minimap } from "../core/minimapstore.js";
import { language, ui } from "../core/i18n.js";
import {
    game, setComponentPosition, setElementScale, positionUpdated, resetComponentsPosition, resetScale
} from "../core/gamestore.js";
import { makeDraggable } from "./position-drag.js";

const PATH = "/position";
const SCALE_MINIMUM = .3;
const SCALE_SPAN = 1.5 - .3;
const HOSTS = ["hud-content", "notify-content", "carhud-content", "minimap-data", "top-left-content", "progress-root"];
const TARGETS = [
    { name: "hud", slot: "hud", id: "hud-content" },
    { name: "notify", slot: "notifies", id: "notify-content" },
    { name: "carhud", slot: "carhud", id: "carhud-content" },
    { name: "progressBar", slot: "progressBar", id: "progress-root" }
];

let screen = null;
let panel = null;
let selectedLabel = null;
let scaleLabel = null;
let scaleRange = null;
let infoHeader = null;
let infoTexts = [];
let clicked = false;
const origins = new Map();

function slotOf(name) {
    const target = TARGETS.find(entry => entry.name === name);
    return target ? target.slot : name;
}

function onScaleChange(percent) {
    if (!clicked) return;
    setElementScale(slotOf(clicked), percent / 100 * SCALE_SPAN + SCALE_MINIMUM);
}

// The hud keeps one position per minimap state; the others keep a single one.
function positionKey(name) {
    if (name !== "hud") return false;
    return minimap.state.isVisible ? "minimap_on" : "minimap_off";
}

function onDragEnd(target, position, rect) {
    positionUpdated(target.slot, position, rect.width, rect.height);
    setComponentPosition(target.slot, positionKey(target.name), position);
    setClass(screen, "dragging", false);
    setClass(screen, "dragging-" + target.name, false);
}

function onDrag(target) {
    setClass(screen, "dragging", true);
    setClass(screen, "dragging-" + target.name, true);
}

function armTarget(target) {
    const node = document.getElementById(target.id);
    if (!node) return;
    makeDraggable(node, {
        onDrag: () => onDrag(target),
        onDragEnd: (position, rect) => onDragEnd(target, position, rect),
        onClick: () => selectTarget(target.name)
    });
}

function selectTarget(name) {
    clicked = name;
    render();
}

function buildPanel() {
    panel = el("div", "live-settings-content");
    selectedLabel = el("div", "selected-ui");
    const item = el("div", "item-content");
    scaleLabel = el("div", "label");
    scaleRange = createRange(onScaleChange, false);
    item.append(scaleLabel, scaleRange.root);
    panel.append(selectedLabel, item);
    screen.appendChild(panel);
}

function buildInfo() {
    const center = el("div", "center-content");
    const info = el("div", "info");
    infoHeader = el("div", "header");
    const row = el("div", "row");
    infoTexts = [el("div", "text"), el("div", "text")];
    row.append(...infoTexts);
    info.append(infoHeader, row);
    center.appendChild(info);
    screen.appendChild(center);
}

function render() {
    setText(infoHeader, ui("screens.position.header"));
    setText(infoTexts[0], ui("screens.position.text"));
    setText(infoTexts[1], ui("screens.position.tip"));
    setClass(panel, "active", !!clicked);
    scaleLabel.textContent = ui("livesettings.scale");
    if (!clicked) return;
    setText(selectedLabel, ui("livesettings." + clicked));
    const scale = game.state[slotOf(clicked)].scale || 1;
    scaleRange.setValue((scale - SCALE_MINIMUM) / SCALE_SPAN * 100);
}

// The screen borrows the live game layer instead of mounting a second copy.
function adoptHosts(active) {
    HOSTS.forEach(id => {
        const node = document.getElementById(id);
        if (!node) return;
        if (!origins.has(id)) origins.set(id, node.parentNode);
        if (active) screen.appendChild(node);
        else origins.get(id).appendChild(node);
    });
}

function onRouteChanged() {
    const inside = current() === PATH;
    adoptHosts(inside);
    if (inside) return render();
    clicked = false;
    setClass(panel, "active", false);
}

function onKeyDown(event) {
    if (current() !== PATH || event.code !== "KeyR") return;
    resetComponentsPosition();
    resetScale();
}

// The "/position" route: drag the live components and scale them in place.
export function register() {
    screen = document.getElementById("position-screen");
    buildPanel();
    buildInfo();
    registerScreen(PATH, screen);
    TARGETS.forEach(armTarget);
    window.addEventListener("keydown", onKeyDown);
    subscribe(onRouteChanged);
    game.subscribe(() => { if (current() === PATH) render(); });
    language.subscribe(() => { if (current() === PATH) render(); });
    render();
}
