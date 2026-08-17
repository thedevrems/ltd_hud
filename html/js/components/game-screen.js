import { register as registerScreen } from "../core/screens.js";

// The "/" route: the in-game layer every hud component draws into.
export function register() {
    registerScreen("/", document.getElementById("game-screen"));
}
