import { createStore } from "./state.js";
import { post } from "./nui.js";

function iface(name, label, icon, use) {
    return { name, label, icon, use };
}

function type(label) {
    return { use: true, label };
}

function status(name, icon) {
    return { name, icon, value: 0, isVisible: true };
}

const DEFAULTS = {
    // Used until SEND_FULL_CFG lands. Kept in step with Config.Server so the
    // logo shown before the handshake is the local file, not a remote one.
    Server: {
        Logo: "logo.png",
        Name: "My Server"
    },
    Chat: {
        Icons: { me: "ME", do: "DO", ooc: "OOC", twt: "fas fa-twitter" },
        Translate: { player_with_id: "Joueur ID", anonymous: "INCONNU" }
    },
    UI: {
        Interfaces: {
            color: iface("color", "Couleurs", "fas fa-fill", false),
            hud: iface("hud", "HUD", "fas fa-heart", true),
            carhud: iface("carhud", "Véhicule", "fas fa-car", true),
            notifications: iface("notifications", "Notifications", "fas fa-envelope-open", true),
            helpNotify: iface("help_notify", "Notification d'aide", "fas fa-align-left", true),
            progressBar: iface("progress_bar", "Barre de progression", "fas fa-circle-notch", true),
            minimap: iface("map", "GPS", "fas fa-map", true),
            positioning: iface("positioning", "Position", "fas fa-arrows-alt", true)
        }
    },
    Hud: {
        Use: true,
        Status: {
            health: status("health", "fas fa-heart"),
            armour: status("armour", "fas fa-vest"),
            hunger: status("hunger", "fas fa-hamburger"),
            thirst: status("thirst", "fas fa-glass-whiskey")
        },
        Types: {
            basic: type("Basique"),
            skew: type("Incliné"),
            diamond: type("Losange"),
            circle: type("Cercle"),
            modern: type("Moderne")
        }
    },
    Notify: { Use: true, Types: { basic: type("Basique"), modern: type("Moderne") } },
    CarHud: { Use: true, Types: { basic: type("Basique"), default: type("Par défaut") } },
    HelpNotify: { Use: true, Types: { basic: type("Basique"), diamond: type("Losange"), hexagon: type("Hexagone") } },
    ProgressBar: { Use: true, Types: { basic: type("Basique"), diamond: type("Losange"), modern: type("Moderne") } }
};

const SETTINGS_ORDER = ["color", "hud", "carhud", "notifications", "helpNotify", "progressBar", "misc"];

export const config = createStore("config", DEFAULTS);

// The settings screens open on the first interface the server left enabled.
export function settingsPath() {
    const interfaces = config.state.UI.Interfaces;
    for (const name of SETTINGS_ORDER) {
        if (interfaces[name] && interfaces[name].use) return "/menu/" + name;
    }
    return "/";
}

// Rebuilds Hud.Status so its key order follows Hud.Order, as the build does.
export function setConfig(payload) {
    payload.set = true;
    Object.assign(config.state, payload);
    const source = payload.Hud.Status;
    config.state.Hud.Status = {};
    payload.Hud.Order.forEach(key => {
        config.state.Hud.Status[key] = source[key];
    });
    config.emit();
}

export function setHudComponentValue(key, value) {
    if (!config.state.Hud.Status[key]) return;
    config.state.Hud.Status[key].value = value;
    config.emit();
}

export function registerHudStatus(name, data) {
    config.state.Hud.Status[name] = data;
    config.emit();
    post("status.onRegister", { success: true, statusName: name });
}

export function unregisterHudStatus(name) {
    delete config.state.Hud.Status[name];
    config.emit();
    post("status.onUnregister", { success: true, statusName: name });
}
