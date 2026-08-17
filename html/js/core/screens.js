import { post } from "./nui.js";
import sfx from "./sfx.js";
import { enterTransition, leaveTransition } from "./dom.js";

const FOCUS_CHECK_DELAY = 1500;
const CHILD_KIT = "fade";
const routes = new Map();
const listeners = new Set();
const history = [];

let root = null;
let currentPath = "/blank";
let previousPath = "/blank";
let activeChain = [];
let focusTimeout = null;
let escapeGuard = null;

export function mount(container) {
    root = container;
}

// Screens register their root element and, for parents, a child outlet.
export function register(path, element, outletSelector, childKit) {
    const key = normalise(path);
    element.classList.add("screen");
    routes.set(key, { key, element, outletSelector, childKit });
    const nested = key !== "/" && currentPath.startsWith(key + "/");
    if (currentPath === key || nested) activate(resolveChain(currentPath), "default-transition");
}

export function current() {
    return currentPath;
}

export function previous() {
    return previousPath;
}

export function subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
}

export function setEscapeGuard(guard) {
    escapeGuard = guard;
}

function normalise(path) {
    const value = String(path || "/").toLowerCase();
    if (value.length > 1 && value.endsWith("/")) return value.slice(0, -1);
    return value.startsWith("/") ? value : "/" + value;
}

// Vue Router matches case-insensitively; longest registered prefix wins.
function resolveChain(path) {
    const segments = path.split("/").filter(Boolean);
    const chain = [];
    let built = "";
    for (const segment of segments) {
        built += "/" + segment;
        if (routes.has(built)) chain.push(routes.get(built));
    }
    return chain;
}

export function push(path) {
    const target = normalise(path);
    if (target === currentPath) return;
    history.push(currentPath);
    navigate(target);
}

export function replace(path) {
    const target = normalise(path);
    if (target === currentPath) return;
    navigate(target);
}

export function back() {
    if (!history.length) return;
    const target = history.pop();
    navigate(target);
}

function navigate(target) {
    previousPath = currentPath;
    currentPath = target;
    const kit = transitionKit(target);
    activate(resolveChain(target), kit);
    onRouteChanged(target, previousPath, kit);
}

export function transitionKit(path) {
    if (path === "/pausemenu") return "pausemenu-transition";
    if (path.includes("/menu")) return "gamemenu-transition";
    if (path === "/welcome") return "welcome-after-transition";
    if (path.includes("/welcome/")) return "welcome-menu-transition";
    return "default-transition";
}

// Mirrors the route -> screen name table the build posts to Lua.
export function screenName(path) {
    if (path.includes("/pausemenu")) return "pausemenu";
    if (path.includes("/menu")) return "game_menu";
    if (path.includes("/position")) return "position";
    if (path.includes("/preview")) return "preview";
    if (path.includes("/welcome")) return "welcome";
    if (path === "/") return "game";
    if (path === "/mainmenu") return "mainmenu";
    if (path === "/cinematic") return "cinematic_mode";
    return "ROUTE_WAS_NOT_DEFINED";
}

function activate(chain, kit) {
    const previous = activeChain;
    activeChain = chain;
    dropLeaving(previous, chain, kit);
    chain.forEach((entry, index) => {
        if (previous.includes(entry)) return;
        show(entry, chain[index - 1], kitAt(chain, index, kit));
    });
}

// A leaving branch animates at its highest level only; deeper screens follow it out.
function dropLeaving(previous, chain, kit) {
    const leaving = previous.filter(entry => !chain.includes(entry));
    if (!leaving.length) return;
    const head = leaving[0];
    const nested = leaving.slice(1);
    hide(head, kitAt(previous, previous.indexOf(head), kit), () => nested.forEach(deactivate));
}

// Nested screens ride their parent's outlet transition, not the router kit.
function kitAt(chain, index, kit) {
    if (index === 0) return kit;
    return chain[index - 1].childKit || CHILD_KIT;
}

function show(entry, parent, kit) {
    const host = parent ? parent.element.querySelector(parent.outletSelector) : root;
    if (host && entry.element.parentNode !== host) host.appendChild(entry.element);
    entry.element.classList.remove("is-leaving");
    entry.element.classList.add("is-active");
    if (kit) enterTransition(entry.element, kit);
}

function hide(entry, kit, onDone) {
    const finish = () => {
        deactivate(entry);
        if (onDone) onDone();
    };
    if (!kit) return finish();
    entry.element.classList.remove("is-active");
    entry.element.classList.add("is-leaving");
    leaveTransition(entry.element, kit, finish);
}

function deactivate(entry) {
    entry.element.classList.remove("is-active", "is-leaving");
}

function onRouteChanged(to, from, kit) {
    const name = screenName(to);
    sfx.unfasten.volume(name === "game" ? .1 : 0);
    routeSfx(to, from);
    scheduleFocusCheck(name);
    post("storage.switchedScreen", { path: name });
    listeners.forEach(listener => listener(to, from, kit));
}

// HANDLE_SFX_ROUTE: two specific transitions carry a sound.
function routeSfx(to, from) {
    if (to === "/pausemenu" && from === "/") return sfx.plum.play();
    if (to.includes("/menu") && from === "/pausemenu") return sfx.enter.play();
}

function scheduleFocusCheck(name) {
    if (focusTimeout) clearTimeout(focusTimeout);
    focusTimeout = setTimeout(() => {
        focusTimeout = null;
        post("base.checkNUIFocusState", { path: name });
    }, FOCUS_CHECK_DELAY);
}

const ESCAPE_IGNORED = ["/mainmenu", "/welcome", "/preview", "/cinematic"];

function onEscape() {
    if (ESCAPE_IGNORED.some(path => currentPath.includes(path))) return;
    if (escapeGuard && escapeGuard()) return;
    if (currentPath === "/pausemenu") {
        post("pauseMenu.left", { state: false });
        return push("/");
    }
    if (previousPath.includes("/welcome") && currentPath === "/") return;
    back();
}

// Capture phase keeps the route guard reading the path a screen has yet to leave,
// the way Vue Router's asynchronous navigation did for the app-level listener.
export function listenForEscape() {
    window.addEventListener("keydown", event => {
        if (!event.repeat && event.code === "Escape") onEscape();
    }, true);
}
