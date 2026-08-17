import { createStore } from "./state.js";
import { readJSON, hasKey } from "./storage.js";
import { convertHexToRGBA, toPixels } from "./format.js";
import { setConfig } from "./config.js";
import { game, setStorage, setColor, setMiniComponentsList } from "./gamestore.js";
import { post } from "./nui.js";
import { setStorageData } from "./musicstore.js";

const FALLBACK_MUSIC = "https://www.youtube.com/watch?v=bN3OKJ_lbK0";

// Resolved slots other components pick up without importing each other.
export const bootstrapped = createStore("bootstrap", { music: null, storage: null });

export function applyFullConfig(payload) {
    const cfg = payload.config;
    setConfig(cfg);

    const slots = {
        UIConfigured: hasKey("UIConfigured"),
        hud: resolveHud(cfg),
        carhud: resolvePositioned(cfg, "carhud_storage", cfg.UI.Preset.carhud),
        notify: resolvePositioned(cfg, "notifies_storage", cfg.UI.Preset.notify),
        progressbar: resolvePositioned(cfg, "progressbar_storage", cfg.UI.Preset.progressBar),
        helpnotify: readJSON("helpnotify_storage") || cfg.UI.Preset.helpNotify,
        misc: readJSON("misc_storage") || cfg.UI.Preset.misc
    };
    const music = readJSON("music_storage") || cfg.UI.Preset.music;

    forcePlainMode(cfg, slots.hud);
    forcePlainMode(cfg, slots.notify);
    applyMusicFallbacks(cfg, music);
    applyMiscFallbacks(cfg, slots);

    setStorageData(music);
    bootstrapped.assign({ music, storage: slots });
    post("storage.onLoad", slots);
    setStorage(slots);
    applyColors(resolveColor(cfg));
    setMiniComponentsList("hud", buildHudVisibility(cfg));
}

function resolveHud(cfg) {
    const stored = readJSON("hud_storage");
    if (stored) return stored;
    const preset = cfg.UI.Preset.hud;
    convertPosition(preset.position.minimap_on);
    convertPosition(preset.position.minimap_off);
    return preset;
}

function resolvePositioned(cfg, key, preset) {
    const stored = readJSON(key);
    if (stored) return stored;
    convertPosition(preset.position);
    return preset;
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
