import { register as registerScreen, current } from "../core/screens.js";
import { minimap } from "../core/minimapstore.js";
import { base } from "../core/basestore.js";
import { setClass } from "../core/dom.js";
import { scoped, provide } from "../core/debug.js";

const debug = scoped("game-screen");

// Layers whose opacity the CSS gates behind ".ui-screen.visible".
const GATED_LAYERS = ["hud-content", "carhud-content", "minimap-data", "chat-content", "top-right-content"];

let screen = null;
let topLeft = null;
let lastVisible = null;

// The top-left column tracks the left edge of the game minimap.
function applyTopLeft() {
    if (!topLeft) return;
    topLeft.style.left = minimap.state.base.left_x + "%";
}

// SET_UI_VISIBLE fades every layer that opts into the screen visibility class.
function applyVisibility() {
    const state = base.state.isGameVisible;
    setClass(screen, "visible", state);
    if (state === lastVisible) return;
    const first = lastVisible === null;
    lastVisible = state;
    // The boot state is not a transition, so it stays out of the F8 mirror.
    if (first) return debug.trace(`#game-screen starts with visible=${state}`);
    debug.log(`#game-screen "visible" class -> ${state}`, layerReport());
}

// Reads what the player actually sees, not what the state says it should be.
function layerReport() {
    const report = {};
    GATED_LAYERS.forEach(id => {
        const node = document.getElementById(id);
        if (!node) {
            report[id] = "MISSING FROM DOM";
            return;
        }
        const style = getComputedStyle(node);
        report[id] = {
            children: node.children.length,
            opacity: style.opacity,
            display: style.display,
            visible: style.opacity !== "0" && style.display !== "none"
        };
    });
    return report;
}

export function inspect() {
    return {
        route: current(),
        screenClasses: screen ? Array.from(screen.classList) : "no #game-screen",
        isActive: screen ? screen.classList.contains("is-active") : false,
        hasVisibleClass: screen ? screen.classList.contains("visible") : false,
        layers: layerReport()
    };
}

// The "/" route: the in-game layer every hud component draws into.
export function register() {
    screen = document.getElementById("game-screen");
    registerScreen("/", screen);
    topLeft = document.getElementById("top-left-content");
    provide("gameScreen", inspect);
    minimap.subscribe(applyTopLeft);
    base.subscribe(applyVisibility);
    applyTopLeft();
    applyVisibility();
}
