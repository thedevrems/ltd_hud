import { LIVE_TYPES, BUILD_ONLY_TYPES, INERT_TYPES } from "./message-types.js";
import * as screens from "./screens.js";
import { post } from "./nui.js";
import { play as playSfx } from "./sfx.js";
import { animate } from "./dom.js";
import { setTranslations } from "./i18n.js";
import { config, settingsPath } from "./config.js";
import { applyFullConfig } from "./bootstrap.js";
import { setIsGameVisible, setIsDataLoaded, setCinematicFocusMode } from "./basestore.js";
import { setComponentVisibility, setMiniComponentVisibility, addQueueToAnimationsList } from "./gamestore.js";
import { clearAll } from "./storage.js";
import { scoped, provide, dump } from "./debug.js";

const BLACK_SCREEN_EASING = "cubic-bezier(0.075, 0.82, 0.165, 1)";

// Chatty types: traced, never mirrored, so the F8 console stays readable.
const NOISY_TYPES = new Set([
    "UPDATE_HUD_VALUE", "SET_CARHUD_VALUES", "UPDATE_CARHUD_VALUE", "UPDATE_ROTATIONS",
    "SET_STATUS_VALUE", "SET_VOICE_INDICATOR_DATA", "SET_VOICE_INDICATOR_PLAYER_TALKING",
    "SET_STREETLABEL_DATA", "SET_RADAR_SIZE", "UPDATE_ASPECT_RATIO"
]);

const debug = scoped("bus");
const seen = new Map();
const handlers = new Map();

export function on(type, handler) {
    handlers.set(type, handler);
}

export function has(type) {
    return handlers.has(type);
}

// Unknown types stay silent, exactly like the build's `this[type] && ...` guard.
export function dispatch(type, data) {
    seen.set(type, (seen.get(type) || 0) + 1);
    const handler = handlers.get(type);
    if (!handler) {
        // Silent in the build, but a typo'd SendNUIMessage looks exactly like this.
        return debug.warn(`<- ${type} has no handler (message dropped)`, data);
    }
    if (NOISY_TYPES.has(type)) debug.trace(`<- ${type}`, data);
    else debug.log(`<- ${type}`, data);
    try {
        handler(data);
    } catch (err) {
        debug.error(`handler for ${type} threw: ${err && err.message}`, err && err.stack);
    }
}

function registerPlaceholders() {
    LIVE_TYPES.concat(BUILD_ONLY_TYPES).forEach(type => {
        if (!handlers.has(type)) on(type, data => console.debug(`[bus] unhandled ${type}`, data));
    });
    INERT_TYPES.forEach(type => on(type, () => {}));
}

function registerRouting() {
    on("SET_SCREEN", data => {
        if (data.screen === "WELCOME") {
            const target = config.state.UI.UseMusic ? "/welcome/music" : "/welcome/presets";
            debug.log(`SET_SCREEN WELCOME -> ${target} (UI.UseMusic=${!!config.state.UI.UseMusic})`);
            return screens.push(target);
        }
        if (data.screen === "GAME") return screens.push("/");
        if (data.screen === "PREVIEW") return screens.push("/preview");
        debug.warn(`SET_SCREEN with unknown screen "${data.screen}"`);
    });
    on("SET_ROUTER_PATH", data => screens.push(data.path));
    on("HANDLE_MAP_VIEW", data => screens.push(data.state ? "/map" : "/"));
    on("SHOW_PAUSEMENU", data => screens.push(data.state ? "/pausemenu" : "/"));
    on("SET_CINEMATIC_MODE_STATE", data => screens.push(data.state ? "/cinematic" : "/"));
    on("SHOW_SETTINGS", data => screens.push(data.state ? settingsPath() : "/"));
}

function registerTransverse() {
    on("SEND_FULL_CFG", data => applyFullConfig(data));
    on("LOAD_UP_TRANSLATIONS", data => setTranslations(data));
    on("SET_UI_VISIBLE", data => setIsGameVisible(data.state));
    on("SET_UI_DATA_STATUS", data => setIsDataLoaded(data.state));
    on("SET_CINEMATIC_FOCUS_MODE", data => setCinematicFocusMode(data.state));
    on("SET_COMPONENT_VISIBILITY", data => setComponentVisibility(data.component, data.state));
    on("SET_MINICOMPONENT_VISIBILITY", data => setMiniComponentVisibility(data.component, data.element, data.state));
    on("APPLY_EFFECT_ON_INTERFACE", data => addQueueToAnimationsList(data.interface, data.element, data.state));
    on("HANDLE_SFX_MESSAGE", data => playSfx(data.sfx));
    on("HANDLE_BLACK_SCREEN", data => runBlackScreen(data));
    on("REMOVE_STORAGE_FULLY", () => clearAll());
    on("SET_GAME_STORAGE", () => {});
    on("OBTAIN_LOCAL_DATA", () => post("base.onBodyLoaded", { state: false }));
    on("DEBUG_DUMP_STATE", data => dump((data && data.reason) || "lua"));
}

// anime.js chained easing, reproduced through the Web Animations API.
function runBlackScreen(data) {
    const node = document.getElementById("black-screen");
    if (!node) return;
    const frames = data.state ? [{ opacity: 0 }, { opacity: 1 }] : [{ opacity: 1 }, { opacity: 0 }];
    animate(node, frames, { duration: data.duration, easing: BLACK_SCREEN_EASING });
}

export function start() {
    registerRouting();
    registerTransverse();
    registerPlaceholders();
    provide("bus", () => ({
        handlers: handlers.size,
        received: Object.fromEntries(seen),
        cfgReceived: !!config.state.set
    }));
    screens.mount(document.getElementById("screen-root"));
    screens.listenForEscape();
    window.addEventListener("message", event => {
        const message = event.data;
        if (message && message.type) dispatch(message.type, message.data);
    });
    debug.log(`bus started with ${handlers.size} handlers, awaiting SEND_FULL_CFG`);
    post("base.onBodyLoaded", { state: false });
    screens.push("/blank");
}
