import { register as registerScreen, push, subscribe } from "../core/screens.js";
import { setStaggerTransition, setPreviewVisible } from "../core/welcomestore.js";
import sfx from "../core/sfx.js";

const PATH = "/welcome";
const OUTLET = ".view-content";
const CHILD_KIT = "welcome-transition";
const PREVIEW_STAGGER_DELAY = 1000;

function childOf(path) {
    return path.startsWith(PATH + "/") ? path.split("/")[2] : "";
}

// Each welcome child slides in over the same woosh the build played on enter.
function onRouteChanged(to, from) {
    const child = childOf(to);
    if (child && child !== childOf(from)) sfx.woosh2.play();
}

// PREVIEW_INIT: back to the game layer, then the tiles pull away from it.
function onPreviewInit() {
    push("/");
    setPreviewVisible(true);
    setTimeout(() => setStaggerTransition(false), PREVIEW_STAGGER_DELAY);
}

// The "/welcome" route: the black backdrop hosting the first-run flow.
export function register(bus) {
    const screen = document.getElementById("welcome-screen");
    registerScreen(PATH, screen, OUTLET, CHILD_KIT);
    bus.on("SET_STAGGER_VISIBILITY", data => setStaggerTransition(data.state));
    bus.on("SET_PREVIEW_VISIBILITY", data => setPreviewVisible(data.state));
    bus.on("PREVIEW_INIT", onPreviewInit);
    subscribe(onRouteChanged);
}
