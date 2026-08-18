import { el, setText, setClass } from "../core/dom.js";
import { register as registerScreen, current, subscribe } from "../core/screens.js";
import { createRange } from "../core/widgets.js";
import { claimLiveLayer, releaseLiveLayer, slotOf } from "../core/live-layer.js";
import { language, ui } from "../core/i18n.js";
import { game, setElementScale, resetComponentsPosition, resetScale } from "../core/gamestore.js";

const PATH = "/position";
const SCALE_MINIMUM = .3;
const SCALE_SPAN = 1.5 - .3;

let screen = null;
let panel = null;
let selectedLabel = null;
let scaleLabel = null;
let scaleRange = null;
let infoHeader = null;
let infoTexts = [];
let clicked = false;

function onScaleChange(percent) {
    if (!clicked) return;
    setElementScale(slotOf(clicked), percent / 100 * SCALE_SPAN + SCALE_MINIMUM);
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

function onRouteChanged() {
    const inside = current() === PATH;
    if (inside) {
        claimLiveLayer(screen, selectTarget);
        return render();
    }
    releaseLiveLayer(screen);
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
    window.addEventListener("keydown", onKeyDown);
    subscribe(onRouteChanged);
    game.subscribe(() => { if (current() === PATH) render(); });
    language.subscribe(() => { if (current() === PATH) render(); });
    render();
}
