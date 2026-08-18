import { register as registerScreen } from "../core/screens.js";
import { minimap } from "../core/minimapstore.js";
import { base } from "../core/basestore.js";
import { setClass } from "../core/dom.js";

let screen = null;
let topLeft = null;

// The top-left column tracks the left edge of the game minimap.
function applyTopLeft() {
    if (!topLeft) return;
    topLeft.style.left = minimap.state.base.left_x + "%";
}

// SET_UI_VISIBLE fades every layer that opts into the screen visibility class.
function applyVisibility() {
    setClass(screen, "visible", base.state.isGameVisible);
}

// The "/" route: the in-game layer every hud component draws into.
export function register() {
    screen = document.getElementById("game-screen");
    registerScreen("/", screen);
    topLeft = document.getElementById("top-left-content");
    minimap.subscribe(applyTopLeft);
    base.subscribe(applyVisibility);
    applyTopLeft();
    applyVisibility();
}
