import { createStore } from "./state.js";
import { seed, readSlot, isConfigured, storedSlots } from "./storage.js";
import { toPixels } from "./format.js";
import { applyInterfaceColors } from "./theme.js";
import { setConfig } from "./config.js";
import { game, setStorage, seedColor, setMiniComponentsList } from "./gamestore.js";
import { post } from "./nui.js";
import { setStorageData } from "./musicstore.js";
import { scoped, provide, setEnabled, setMirror } from "./debug.js";

const debug = scoped("bootstrap");
const FALLBACK_MUSIC = "https://www.youtube.com/watch?v=bN3OKJ_lbK0";

// Where each slot came from this session: "database" or "Config.UI.Preset".
const slotOrigins = {};

// Resolved slots other components pick up without importing each other.
export const bootstrapped = createStore("bootstrap", { music: null, storage: null });

provide("bootstrap", () => ({
    configReceived: !!bootstrapped.state.storage,
    UIConfigured: isConfigured(),
    slotOrigins,
    storedSlots: storedSlots()
}));

export function applyFullConfig(payload) {
    const cfg = payload.config;
    // Config.Debug drives both the Lua trace and this one, so they match.
    setEnabled(cfg.Debug !== false);
    setMirror(cfg.DebugNUIMirror !== false);
    debug.log(`SEND_FULL_CFG received (Debug=${cfg.Debug}, UseWelcomeScreen=${cfg.UI && cfg.UI.UseWelcomeScreen}, UseConfiguration=${cfg.UI && cfg.UI.UseConfiguration}, Hud.Use=${cfg.Hud && cfg.Hud.Use})`);
    setConfig(cfg);

    // Le document du compte arrive avec la config, encodé, et c'est lui qui
    // décide de chaque créneau ci-dessous. Rien avant ce point ne lit de
    // réglage : l'ordre est ce qui garantit qu'un joueur qui a déjà un HUD ne
    // voit jamais les préréglages du serveur, fût-ce une frame.
    const restored = seed(payload.stored);
    debug.log(`document du compte ${restored ? "restauré depuis la base" : "absent (aucun HUD enregistré)"}`, storedSlots());

    const color = resolveColor(cfg);
    const slots = {
        UIConfigured: isConfigured(),
        // Envoyé à Lua avec les autres : Storage.GetHudColor lit Storage.Data.color
        // et sert dès le premier Point.Create, bien avant qu'un changement de
        // couleur ne l'ait renseigné.
        color,
        hud: resolveHud(cfg),
        carhud: resolvePositioned(cfg, "carhud", cfg.UI.Preset.carhud),
        notify: resolvePositioned(cfg, "notifies", cfg.UI.Preset.notify),
        progressbar: resolvePositioned(cfg, "progressbar", cfg.UI.Preset.progressBar),
        helpnotify: resolvePlain(cfg, "helpnotify", cfg.UI.Preset.helpNotify),
        misc: resolvePlain(cfg, "misc", cfg.UI.Preset.misc)
    };
    const music = readSlot("music") || cfg.UI.Preset.music;

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
    applyColors(color);
    const visibility = buildHudVisibility(cfg, slots.hud);
    debug.log(`hud statuses from config: ${Object.keys(visibility).join(", ") || "NONE"}`, visibility);
    setMiniComponentsList("hud", visibility);
}

// Le créneau enregistré recouvre le préréglage, il ne le remplace pas. Un
// document écrit par une version antérieure peut ne pas porter toutes les clés
// (`refreshInterval` par exemple, que Threads.Vehicles lit sans filet côté Lua) ;
// la fusion garantit qu'une clé manquante retombe sur le préréglage du serveur
// plutôt que sur `undefined`.
function mergeSlot(preset, stored) {
    if (!stored) return preset;
    const merged = Object.assign({}, preset, stored);
    merged.options = Object.assign({}, preset.options, stored.options);
    return merged;
}

function resolveHud(cfg) {
    const stored = readSlot("hud");
    slotOrigins.hud = stored ? "database" : "Config.UI.Preset";
    const preset = cfg.UI.Preset.hud;
    convertPosition(preset.position.minimap_on);
    convertPosition(preset.position.minimap_off);
    return mergeSlot(preset, stored);
}

function resolvePositioned(cfg, slot, preset) {
    const stored = readSlot(slot);
    slotOrigins[slot] = stored ? "database" : "Config.UI.Preset";
    convertPosition(preset.position);
    return mergeSlot(preset, stored);
}

function resolvePlain(cfg, slot, preset) {
    const stored = readSlot(slot);
    slotOrigins[slot] = stored ? "database" : "Config.UI.Preset";
    return mergeSlot(preset, stored);
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
    const stored = readSlot("color");
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
    seedColor(color);
    applyInterfaceColors(color);
}

// Config.Hud.Status donne l'état par défaut de chaque jauge ; le choix du joueur
// le recouvre quand il en a fait un. Seules les clés listées dans Hud.Order sont
// reprises, si bien qu'un statut retiré du serveur depuis la dernière connexion
// disparaît au lieu de réapparaître.
function buildHudVisibility(cfg, hudSlot) {
    const stored = (hudSlot && hudSlot.visibility) || {};
    const visibility = {};
    cfg.Hud.Order.forEach(key => {
        visibility[key] = typeof stored[key] === "boolean" ? stored[key] : cfg.Hud.Status[key].isVisible;
    });
    return visibility;
}

export function gameState() {
    return game.state;
}
