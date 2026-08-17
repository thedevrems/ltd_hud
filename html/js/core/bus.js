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

const BLACK_SCREEN_EASING = "cubic-bezier(0.075, 0.82, 0.165, 1)";

const handlers = new Map();

export function on(type, handler) {
    handlers.set(type, handler);
}

export function has(type) {
    return handlers.has(type);
}

// Unknown types stay silent, exactly like the build's `this[type] && ...` guard.
export function dispatch(type, data) {
    const handler = handlers.get(type);
    if (handler) handler(data);
}

function registerPlaceholders() {
    LIVE_TYPES.concat(BUILD_ONLY_TYPES).forEach(type => {
        if (!handlers.has(type)) on(type, data => console.debug(`[bus] unhandled ${type}`, data));
    });
    INERT_TYPES.forEach(type => on(type, () => {}));
}

function registerRouting() {
    on("SET_SCREEN", data => {
        if (data.screen === "WELCOME") return screens.push(config.state.UI.UseMusic ? "/welcome/music" : "/welcome/presets");
        if (data.screen === "GAME") return screens.push("/");
        if (data.screen === "PREVIEW") return screens.push("/preview");
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
    screens.mount(document.getElementById("screen-root"));
    screens.listenForEscape();
    window.addEventListener("message", event => {
        const message = event.data;
        if (message && message.type) dispatch(message.type, message.data);
    });
    post("base.onBodyLoaded", { state: false });
    screens.push("/blank");
}
