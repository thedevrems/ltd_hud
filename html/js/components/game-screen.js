import { register as registerScreen } from "../core/screens.js";
import { minimap } from "../core/minimapstore.js";

let topLeft = null;

// The top-left column tracks the left edge of the game minimap.
function applyTopLeft() {
    if (!topLeft) return;
    topLeft.style.left = minimap.state.base.left_x + "%";
}

// The "/" route: the in-game layer every hud component draws into.
export function register() {
    registerScreen("/", document.getElementById("game-screen"));
    topLeft = document.getElementById("top-left-content");
    minimap.subscribe(applyTopLeft);
    applyTopLeft();
}
