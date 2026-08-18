import { el, setText, setClass } from "../core/dom.js";
import { minimap, setBaseData, setVisible } from "../core/minimapstore.js";
import { language, ui } from "../core/i18n.js";
import { current, subscribe } from "../core/screens.js";
import { post } from "../core/nui.js";
import { build as buildSlider, register as registerSlider } from "./minimap-slider.js";

const POSITION_PATH = "/position";
const PREVIEW_PATH = "/preview";

let host = null;
let notifies = null;
let info = null;
let toggle = null;
let toggleText = null;
let hints = {};

// The block tracks the game minimap rectangle reported by SET_RADAR_SIZE.
function applyPosition() {
    if (!host) return;
    const base = minimap.state.base;
    host.style.left = base.left_x + "%";
    host.style.bottom = `calc(100% - (${base.bottom_y + "%"}) + .75%)`;
    host.style.width = base.width + "%";
}

function makeHint(key) {
    const row = el("div", "info-content");
    const label = el("div", "key");
    label.textContent = key;
    const text = el("div", "text");
    row.append(label, text);
    return { row, text };
}

function buildInfo() {
    info = el("div", "position-info-content");
    hints = { reset: makeHint("R"), escape: makeHint("ESC"), enter: makeHint("ENTER") };
    info.append(hints.reset.row, hints.escape.row, hints.enter.row);
}

function buildToggle() {
    toggle = el("div", "toggle-minimap-content");
    toggleText = el("div", "text");
    const icon = el("div", "icon");
    icon.appendChild(el("i", "fas fa-chevron-up"));
    toggle.append(toggleText, icon);
    toggle.addEventListener("click", onToggleClick);
}

function onToggleClick() {
    post("minimap.toggle", { state: !minimap.state.isVisible });
}

// Both live-layer screens share the hints; only preview offers the ENTER row.
function renderHints(isPosition, isPreview) {
    const shown = isPosition || isPreview;
    info.style.display = shown ? "" : "none";
    toggle.style.display = shown ? "" : "none";
    notifies.style.display = isPosition ? "none" : "";
    if (!shown) return;
    setText(hints.reset.text, ui("minimap.reset_position"));
    setText(hints.escape.text, isPosition ? ui("minimap.accept_leave") : ui("minimap.back_to_customization"));
    hints.enter.row.style.display = isPreview ? "" : "none";
    setText(hints.enter.text, ui("minimap.accept_leave"));
    setText(toggleText, ui("minimap.toggle_radar"));
    setClass(toggle, "active", minimap.state.isVisible);
}

function render() {
    applyPosition();
    renderHints(current() === POSITION_PATH, current() === PREVIEW_PATH);
}

export function register(bus) {
    host = document.getElementById("minimap-data");
    notifies = document.getElementById("default-notifies");
    buildInfo();
    buildToggle();
    const content = host.querySelector(".content");
    content.insertBefore(info, notifies.nextSibling);
    content.insertBefore(toggle, info.nextSibling);
    buildSlider(host);
    bus.on("SET_RADAR_SIZE", data => setBaseData(data));
    bus.on("SET_RADAR_VISIBILITY", data => setVisible(data));
    minimap.subscribe(render);
    language.subscribe(render);
    subscribe(render);
    registerSlider();
    render();
}
