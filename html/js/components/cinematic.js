import { el, setText, setHTML, setClass } from "../core/dom.js";
import { register as registerScreen, current, subscribe, back } from "../core/screens.js";
import { language, ui } from "../core/i18n.js";
import { base } from "../core/basestore.js";
import { post } from "../core/nui.js";

const PATH = "/cinematic";
const HINTS = [
    { key: "H", label: "show_hide_tooltips" },
    { key: "E", label: "toggle_cinematic_camera" },
    { key: "K", label: "switch_preset", camera: true },
    { key: "ESC", label: "leave", small: true }
];

let screen = null;
let bar = null;
let tip = null;
let navHelp = null;
let rows = [];
let tooltipOn = true;
let cameraOn = false;

function buildHint(hint) {
    const row = el("div", "help-info");
    const key = el("div", hint.small ? "key small" : "key");
    key.textContent = hint.key;
    const text = el("div", "text");
    row.append(key, text);
    return { root: row, text, hint };
}

function build() {
    screen.appendChild(el("div", "bar"));
    bar = el("div", "bar");
    tip = el("div", "tip");
    navHelp = el("div", "nav-help-info");
    rows = HINTS.map(buildHint);
    navHelp.append(...rows.map(row => row.root));
    bar.append(tip, navHelp);
    screen.appendChild(bar);
}

function render() {
    setClass(bar, "focus", tooltipOn ? base.state.isCinematicFocusModeOn : false);
    setClass(tip, "active", tooltipOn);
    setHTML(tip, ui("cinematic_mode.tip"));
    setClass(navHelp, "active", tooltipOn);
    rows.forEach(row => {
        setText(row.text, ui("cinematic_mode." + row.hint.label));
        if (row.hint.camera) setClass(row.root, "active", cameraOn);
    });
}

// Only the preset row reacts to the camera flag; the build never raises it.
function toggleTooltip() {
    tooltipOn = !tooltipOn;
    render();
}

const KEYS = {
    ShiftLeft: () => post("cinematicMode.setFocusOff", {}),
    Escape: () => { back(); post("cinematicMode.setFocusOff", {}); },
    KeyH: toggleTooltip,
    KeyE: () => post("cinematicMode.toggleCamera", {}),
    KeyK: () => post("cinematicMode.switchPreset", {})
};

function onKeyDown(event) {
    if (event.repeat || current() !== PATH) return;
    const action = KEYS[event.code];
    if (action) action();
}

// Entering the route remounts the component, so the tooltip starts visible.
function onRouteChanged() {
    if (current() !== PATH) return;
    tooltipOn = true;
    cameraOn = false;
    render();
}

export function register() {
    screen = document.getElementById("cinematic-screen");
    build();
    registerScreen(PATH, screen);
    window.addEventListener("keydown", onKeyDown);
    subscribe(onRouteChanged);
    base.subscribe(() => { if (current() === PATH) render(); });
    language.subscribe(() => { if (current() === PATH) render(); });
    render();
}
