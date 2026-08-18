import { el, clear, setText, setClass, animate } from "../core/dom.js";
import { push } from "../core/screens.js";
import { post } from "../core/nui.js";
import { setStaggerTransition } from "../core/welcomestore.js";
import { ui } from "../core/i18n.js";

const EASING = "cubic-bezier(0.075, 0.82, 0.165, 1)";
const ROUTE_THROTTLE = 350;
const BASE = "/welcome/customize/";

let quickRoute = true;

function goToPreview() {
    setStaggerTransition(true);
    post("preview.init", {});
}

function neighbour(parts, forward) {
    const keys = parts.keys;
    const index = keys.indexOf(parts.active);
    const shift = forward ? 1 : -1;
    const moved = (shift === -1 && index > 0) || (shift === 1 && index < keys.length - 1);
    return keys[moved ? index + shift : index];
}

// Stepping past the last interface is what opens the in-game preview.
function step(parts, forward) {
    if (forward && parts.lastReached) return goToPreview();
    if (!quickRoute) return;
    quickRoute = false;
    push(BASE + neighbour(parts, forward));
    setTimeout(() => { quickRoute = true; }, ROUTE_THROTTLE);
}

function chevron(direction) {
    const box = el("div", "icon absolute-content");
    box.appendChild(el("i", "fas fa-chevron-" + direction));
    return box;
}

function previewLabel() {
    const box = el("div", "text absolute-content");
    box.appendChild(el("div", "rotate"));
    return box;
}

// The forward arrow flips between a chevron and the rotated preview caption.
function swapNext(parts, lastReached) {
    const previous = parts.nextFace;
    if (previous) {
        const leave = animate(previous, { transform: ["translateX(0vw)", "translateX(-3vw)"], opacity: [1, 0] }, { easing: EASING });
        if (leave) leave.onfinish = () => previous.remove();
        else previous.remove();
    }
    parts.nextFace = lastReached ? previewLabel() : chevron("right");
    parts.next.appendChild(parts.nextFace);
    animate(parts.nextFace, { transform: ["translateX(3vw)", "translateX(0vw)"], opacity: [0, 1] }, { easing: EASING });
}

function navElement(entry, active) {
    const node = el("div", "nav-element");
    setClass(node, "active", entry.path === active);
    node.onclick = () => push(BASE + entry.path);
    const converted = el("div", "converted-content");
    converted.appendChild(el("i", entry.icon));
    node.appendChild(converted);
    return node;
}

function renderTexts(parts) {
    const rotate = parts.nextFace.querySelector(".rotate");
    if (rotate) setText(rotate, ui("welcome.preview"));
    setText(parts.preview, ui("welcome.preview"));
}

function render(parts, list, path) {
    parts.keys = list.map(entry => entry.path);
    parts.active = path;
    const lastReached = neighbour(parts, true) === path;
    setClass(parts.previous, "disabled", neighbour(parts, false) === path);
    if (parts.lastReached !== lastReached) {
        parts.lastReached = lastReached;
        swapNext(parts, lastReached);
    }
    renderTexts(parts);
    clear(parts.dots);
    list.forEach(entry => parts.dots.appendChild(navElement(entry, path)));
}

// The customisation navbar: previous/next arrows, the preview shortcut and dots.
export function createNavbar() {
    const parts = { keys: [], active: "", lastReached: null, nextFace: null };
    const root = el("div", "navbar-content");
    parts.previous = el("div", "nav-arrow");
    parts.previous.appendChild(el("i", "fas fa-chevron-left"));
    parts.previous.onclick = () => step(parts, false);
    parts.next = el("div", "nav-arrow");
    parts.next.onclick = () => step(parts, true);
    parts.preview = el("div", "preview-button");
    parts.preview.onclick = goToPreview;
    parts.dots = el("div", "navbar");
    root.append(parts.previous, parts.next, parts.preview, parts.dots);
    return { root, render: (list, path) => render(parts, list, path) };
}
