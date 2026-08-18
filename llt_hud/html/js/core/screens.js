import { post } from "./nui.js";
import sfx from "./sfx.js";
import { enterTransition, leaveTransition, clearLeaveTransition } from "./dom.js";
import { scoped, provide } from "./debug.js";

const debug = scoped("router");
const FOCUS_CHECK_DELAY = 1500;
// Routes that mount nothing on purpose: they exist to clear the whole overlay.
const BLANK_ROUTES = new Set(["/blank", "/map"]);
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
    if (!container) debug.error("mount() got no #screen-root: no screen can ever be shown");
    provide("router", () => ({
        current: currentPath,
        previous: previousPath,
        historyDepth: history.length,
        activeChain: activeChain.map(entry => entry.key),
        registered: Array.from(routes.keys()).sort(),
        rootMounted: !!root
    }));
}

// Screens register their root element and, for parents, a child outlet.
export function register(path, element, outletSelector, childKit) {
    const key = normalise(path);
    element.classList.add("screen");
    routes.set(key, { key, element, outletSelector, childKit });
    debug.trace(`registered "${key}"${outletSelector ? ` (outlet ${outletSelector})` : ""}`);
    const nested = key !== "/" && currentPath.startsWith(key + "/");
    if (currentPath === key || nested) {
        debug.log(`"${key}" registered while already routed to "${currentPath}", activating late`);
        activate(resolveChain(currentPath), "default-transition");
    }
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
    // "/" carries no segment of its own, so the loop below can never reach it.
    // Without this the game layer never gains "is-active" and stays display:none.
    if (path === "/") return routes.has("/") ? [routes.get("/")] : [];
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
    if (target === currentPath) return debug.trace(`push("${path}") ignored, already on "${currentPath}"`);
    history.push(currentPath);
    navigate(target, "push");
}

export function replace(path) {
    const target = normalise(path);
    if (target === currentPath) return debug.trace(`replace("${path}") ignored, already on "${currentPath}"`);
    navigate(target, "replace");
}

export function back() {
    if (!history.length) return debug.trace("back() ignored, history is empty");
    const target = history.pop();
    navigate(target, "back");
}

function navigate(target, origin) {
    previousPath = currentPath;
    currentPath = target;
    const kit = transitionKit(target);
    const chain = resolveChain(target);
    debug.log(`${origin}: "${previousPath}" -> "${target}" [${kit}] chain=[${chain.map(e => e.key).join(" > ") || "EMPTY"}]`);
    // An empty chain means nothing is mounted for that path: a blank screen.
    if (!chain.length && !BLANK_ROUTES.has(target)) {
        debug.error(`no screen registered for "${target}" — the UI will render nothing`, Array.from(routes.keys()));
    }
    activate(chain, kit);
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
    hide(head, kitAt(previous, previous.indexOf(head), kit), () => nested.forEach(drop));
}

// Nested screens ride their parent's outlet transition, not the router kit.
function kitAt(chain, index, kit) {
    if (index === 0) return kit;
    return chain[index - 1].childKit || CHILD_KIT;
}

function show(entry, parent, kit) {
    const host = parent ? parent.element.querySelector(parent.outletSelector) : root;
    if (!host) {
        // A parent that registered without a working outlet swallows its children.
        debug.error(`cannot show "${entry.key}": outlet "${parent ? parent.outletSelector : "#screen-root"}" not found`);
        return;
    }
    if (entry.element.parentNode !== host) host.appendChild(entry.element);
    entry.element.classList.remove("is-leaving");
    // Coming back before the previous leave ended would otherwise keep that
    // animation's end state, which paints the screen out from under itself.
    clearLeaveTransition(entry.element);
    entry.element.classList.add("is-active");
    debug.trace(`show "${entry.key}" in ${parent ? parent.key + parent.outletSelector : "#screen-root"} [${kit}]`);
    if (kit) enterTransition(entry.element, kit);
}

function hide(entry, kit, onDone) {
    const finish = () => {
        drop(entry);
        if (onDone) onDone();
    };
    if (!kit) return finish();
    entry.element.classList.remove("is-active");
    entry.element.classList.add("is-leaving");
    leaveTransition(entry.element, kit, finish);
}

// A leave that outlives its own navigation must only drop what is really gone.
// Switching tabs faster than the transition puts the screen back on the chain
// while its leave is still pending, and deactivating it there hides a screen the
// router considers current: the tab then reads as "it did not load".
function drop(entry) {
    if (activeChain.includes(entry)) return debug.trace(`late leave of "${entry.key}" ignored, it is active again`);
    deactivate(entry);
}

function deactivate(entry) {
    entry.element.classList.remove("is-active", "is-leaving");
}

function onRouteChanged(to, from, kit) {
    const name = screenName(to);
    // Lua keys its whole screen state machine off this name.
    if (name === "ROUTE_WAS_NOT_DEFINED") debug.warn(`"${to}" has no Lua screen name, storage.switchedScreen will confuse the client`);
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
        debug.trace(`focus check for "${name}"`);
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
