import { createStore } from "../core/state.js";
import { game } from "../core/gamestore.js";
import { config } from "../core/config.js";
import { post } from "../core/nui.js";
import { clear, setClass, animate } from "../core/dom.js";
import { liveLayer } from "../core/live-layer.js";
import { ui } from "../core/i18n.js";
import * as screens from "../core/screens.js";
import { VARIANTS } from "./progressbar-variants.js";

const SKIPPED_DURATIONS = [-1, -10];
// Routes that draw the bar: the game layer plus the two placement screens.
const LIVE_ROUTES = ["/", "/position", "/preview"];
const DEMO_PROGRESS = 60;

export const progress = createStore("progressbar", { current: false, value: 0 });

let root = null;
let host = null;
let node = null;
let selected = null;
let fill = null;

function stopFill() {
    if (fill) fill.cancel();
    fill = null;
}

// Linear width fill; reaching the end reports the run as complete to Lua.
function startFill(duration) {
    if (!node || !duration || SKIPPED_DURATIONS.includes(duration)) return;
    fill = animate(node.value, { width: ["0%", "100%"] }, { duration, easing: "linear" });
    if (fill) fill.onfinish = () => post("progress.onFinish", {});
}

// No run is in flight while the bar is being placed, so it borrows the label
// the build hardcoded into the placement screens.
function currentData() {
    if (!liveLayer.state.active) return progress.state.current || {};
    return { icon: ui("test_components.progress_bar.icon"), text: ui("test_components.progress_bar.text"), duration: -1 };
}

function mountVariant() {
    selected = game.state.progressBar.selected;
    clear(host);
    const build = VARIANTS[selected];
    node = build ? build(currentData()) : null;
    if (node) host.appendChild(node.root);
}

function onInit(data) {
    progress.state.current = data;
    progress.state.value = 0;
    stopFill();
    mountVariant();
    progress.emit();
    startFill(data.duration);
}

// Removal freezes the bar where it stood, exactly as the paused anime.js did.
function onRemove() {
    progress.state.current = false;
    if (fill) fill.pause();
    progress.emit();
}

function onUpdateProgress(data) {
    progress.state.value = data.progress;
    progress.emit();
}

function render() {
    const demo = liveLayer.state.active;
    setClass(host, "active", demo || progress.state.current !== false);
    if (node) node.value.style.width = (demo ? DEMO_PROGRESS : progress.state.value) + "%";
}

function renderContainer() {
    const slot = game.state.progressBar;
    root.style.transform = `scale(${slot.scale || 1})`;
    root.style.left = slot.position.x ? slot.position.x + "px" : "";
    root.style.top = slot.position.y ? slot.position.y + "px" : "";
    host.style.display = config.state.ProgressBar.Use ? "" : "none";
}

// The bar shows on the in-game routes, like the build's opacity binding.
function renderRoute() {
    root.style.opacity = LIVE_ROUTES.includes(screens.current()) ? 1 : 0;
}

function onStorageChanged() {
    if (game.state.progressBar.selected !== selected) mountVariant();
    renderContainer();
    render();
}

// Entering or leaving a placement screen swaps the demo data for the real run.
function onLiveLayerChanged() {
    mountVariant();
    render();
}

export function register(bus) {
    root = document.getElementById("progress-root");
    host = document.getElementById("progressbar-content");
    bus.on("PROGRESS_BAR_INIT", data => onInit(data));
    bus.on("PROGRESS_BAR_REMOVE", () => onRemove());
    bus.on("PROGRESS_BAR_UPDATE_PROGRESS", data => onUpdateProgress(data));
    progress.subscribe(render);
    liveLayer.subscribe(onLiveLayerChanged);
    game.subscribe(onStorageChanged);
    config.subscribe(renderContainer);
    screens.subscribe(renderRoute);
    mountVariant();
    renderContainer();
    renderRoute();
    render();
}
