import { createStore } from "./state.js";
import { readJSON, hasKey } from "./storage.js";
import { convertHexToRGBA, toPixels } from "./format.js";
import { setConfig } from "./config.js";
import { game, setStorage, setColor, setMiniComponentsList } from "./gamestore.js";
import { post } from "./nui.js";
import { setStorageData } from "./musicstore.js";
import { scoped, provide, setEnabled, setMirror } from "./debug.js";

const debug = scoped("bootstrap");
const FALLBACK_MUSIC = "https://www.youtube.com/watch?v=bN3OKJ_lbK0";

// Where each slot came from this session: "localStorage" or "Config.UI.Preset".
const slotOrigins = {};

// Resolved slots other components pick up without importing each other.
export const bootstrapped = createStore("bootstrap", { music: null, storage: null });

provide("bootstrap", () => ({
    configReceived: !!bootstrapped.state.storage,
    UIConfigured: hasKey("UIConfigured"),
    slotOrigins,
    localStorageKeys: listStorageKeys()
}));

function listStorageKeys() {
    try {
        return Object.keys(localStorage).filter(key => key.endsWith("_storage") || key === "UIConfigured");
    } catch (error) {
        return "<localStorage unavailable>";
    }
}

export function applyFullConfig(payload) {
    const cfg = payload.config;
    // Config.Debug drives both the Lua trace and this one, so they match.
    setEnabled(cfg.Debug !== false);
    setMirror(cfg.DebugNUIMirror !== false);
    debug.log(`SEND_FULL_CFG received (Debug=${cfg.Debug}, UseWelcomeScreen=${cfg.UI && cfg.UI.UseWelcomeScreen}, UseConfiguration=${cfg.UI && cfg.UI.UseConfiguration}, Hud.Use=${cfg.Hud && cfg.Hud.Use})`);
    setConfig(cfg);

    const slots = {
        UIConfigured: hasKey("UIConfigured"),
        hud: resolveHud(cfg),
        carhud: resolvePositioned(cfg, "carhud_storage", cfg.UI.Preset.carhud),
        notify: resolvePositioned(cfg, "notifies_storage", cfg.UI.Preset.notify),
        progressbar: resolvePositioned(cfg, "progressbar_storage", cfg.UI.Preset.progressBar),
        helpnotify: resolvePlain(cfg, "helpnotify_storage", cfg.UI.Preset.helpNotify),
        misc: resolvePlain(cfg, "misc_storage", cfg.UI.Preset.misc)
    };
    const music = readJSON("music_storage") || cfg.UI.Preset.music;

    forcePlainMode(cfg, slots.hud);
    forcePlainMode(cfg, slots.notify);
    applyMusicFallbacks(cfg, music);
    applyMiscFallbacks(cfg, slots);

    debug.log(`slots resolved (UIConfigured=${slots.UIConfigured})`, slotOrigins);
    debug.log(`hud slot: selected=${slots.hud.selected} isVisible=${slots.hud.isVisible} 3d=${slots.hud.options && slots.hud.options["3d-mode"]}`);

    setStorageData(music);
    bootstrapped.assign({ music, storage: slots });
    post("storage.onLoad", slots);
    setStorage(slots);
    applyColors(resolveColor(cfg));
    const visibility = buildHudVisibility(cfg);
    debug.log(`hud statuses from config: ${Object.keys(visibility).join(", ") || "NONE"}`, visibility);
    setMiniComponentsList("hud", visibility);
}

function resolveHud(cfg) {
    const stored = readJSON("hud_storage");
    slotOrigins.hud = stored ? "localStorage" : "Config.UI.Preset";
    if (stored) return stored;
    const preset = cfg.UI.Preset.hud;
    convertPosition(preset.position.minimap_on);
    convertPosition(preset.position.minimap_off);
    return preset;
}

function resolvePositioned(cfg, key, preset) {
    const stored = readJSON(key);
    slotOrigins[key] = stored ? "localStorage" : "Config.UI.Preset";
    if (stored) return stored;
    convertPosition(preset.position);
    return preset;
}

function resolvePlain(cfg, key, preset) {
    const stored = readJSON(key);
    slotOrigins[key] = stored ? "localStorage" : "Config.UI.Preset";
    return stored || preset;
}

function convertPosition(position) {
    if (!position || !position.x || !position.y) return;
    position.x = toPixels(position.x, window.innerWidth);
    position.y = toPixels(position.y, window.innerHeight);
}

// 3D mode is unavailable unless both perspective switches are on.
function forcePlainMode(cfg, slot) {
    if (!slot || !slot.options || !slot.options["3d-mode"]) return;
    if (cfg.UsePerspective && cfg.UI.Use3DContent) return;
    slot.options["3d-mode"] = false;
}

function applyMusicFallbacks(cfg, music) {
    if (!music.url) music.url = cfg.UI.Preset.music.url || FALLBACK_MUSIC;
    if (music.volume <= 0) music.volume = 5;
}

function applyMiscFallbacks(cfg, slots) {
    if (!slots.hud.options.vertical) slots.hud.options.vertical = false;
    if (!slots.misc.options.chat_size) slots.misc.options.chat_size = cfg.Chat.Size;
    if (!cfg.Chat.AllowUserChangeSize) slots.misc.options.chat_size = cfg.Chat.Size;
}

function resolveColor(cfg) {
    const stored = readJSON("color_storage");
    const defaults = {};
    cfg.Hud.Order.forEach(key => { defaults[key] = cfg.UI.DefaultColor; });

    const color = stored && stored.hud ? stored : {
        primaryColor: cfg.UI.DefaultColor,
        primaryBackground: cfg.UI.DefaultPrimaryBackground,
        backgroundColor: cfg.UI.DefaultBackgroundColor,
        primaryBackgroundOpacity: cfg.UI.DefaultPrimaryBackgroundOpacity,
        backgroundColorOpacity: cfg.UI.DefaultBackgroundColorOpacity,
        useCustomHudColors: false,
        hud: defaults
    };
    if (stored) cfg.Hud.Order.forEach(key => {
        if (!color.hud[key]) color.hud[key] = cfg.UI.DefaultColor;
    });
    return color;
}

function applyColors(color) {
    ["primaryColor", "useCustomHudColors", "primaryBackground", "backgroundColor",
        "primaryBackgroundOpacity", "backgroundColorOpacity", "hud"
    ].forEach(key => setColor(key, color[key]));

    const root = document.documentElement.style;
    root.setProperty("--primary-color", color.primaryColor);
    root.setProperty("--primary-background", convertHexToRGBA(color.primaryBackground, color.primaryBackgroundOpacity));
    root.setProperty("--default-background-game-menu", convertHexToRGBA(color.backgroundColor, color.backgroundColorOpacity));
}

function buildHudVisibility(cfg) {
    const visibility = {};
    cfg.Hud.Order.forEach(key => {
        visibility[key] = cfg.Hud.Status[key].isVisible;
    });
    return visibility;
}

export function gameState() {
    return game.state;
}
