import { el, setText } from "../core/dom.js";
import { register as registerScreen, current, subscribe } from "../core/screens.js";
import { claimLiveLayer, releaseLiveLayer } from "../core/live-layer.js";
import { resetComponentsPosition } from "../core/gamestore.js";
import { writeJSON } from "../core/storage.js";
import { post } from "../core/nui.js";
import { language, ui } from "../core/i18n.js";

const PATH = "/preview";

let screen = null;
let infoHeader = null;
let infoText = null;

function buildInfo() {
    const center = el("div", "center-content");
    const info = el("div", "info");
    infoHeader = el("div", "header");
    const row = el("div", "row");
    infoText = el("div", "text");
    row.append(el("div", "line"), infoText);
    info.append(infoHeader, row);
    center.appendChild(info);
    screen.appendChild(center);
}

function render() {
    setText(infoHeader, ui("screens.preview.header"));
    setText(infoText, ui("screens.preview.text"));
}

function onRouteChanged() {
    if (current() !== PATH) return releaseLiveLayer(screen);
    claimLiveLayer(screen, () => {});
    render();
}

// Enter accepts the layout, Escape goes back to the flow, R resets the drags.
function onKeyDown(event) {
    if (current() !== PATH || event.repeat) return;
    if (event.code === "Enter") {
        post("preview.end", {});
        writeJSON("UIConfigured", true);
    }
    if (event.code === "Escape") post("preview.goBackToCustomize", {});
    if (event.code === "KeyR") resetComponentsPosition();
}

// The "/preview" route: place the components against the live game camera.
export function register() {
    screen = el("div", "position-screen", { id: "preview-screen" });
    buildInfo();
    registerScreen(PATH, screen);
    window.addEventListener("keydown", onKeyDown);
    subscribe(onRouteChanged);
    language.subscribe(() => { if (current() === PATH) render(); });
    render();
}
