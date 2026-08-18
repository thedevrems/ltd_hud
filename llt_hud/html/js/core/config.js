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
        Translate: { player_with_id: "Player with ID", anonymous: "UNKN0WN" }
    },
    UI: {
        Interfaces: {
            color: iface("color", "Color", "fas fa-fill", false),
            hud: iface("hud", "Hud", "fas fa-heart", true),
            carhud: iface("carhud", "CarHud", "fas fa-car", true),
            notifications: iface("notifications", "Color", "fas fa-envelope-open", true),
            helpNotify: iface("help_notify", "Help Notify", "fas fa-align-left", true),
            progressBar: iface("progress_bar", "Progress Bar", "fas fa-circle-notch", true),
            minimap: iface("map", "Minimap", "fas fa-map", true),
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
            basic: type("Basic"),
            skew: type("Skew"),
            diamond: type("Diamond"),
            circle: type("Circle"),
            modern: type("Modern")
        }
    },
    Notify: { Use: true, Types: { basic: type("Basic"), modern: type("Modern") } },
    CarHud: { Use: true, Types: { basic: type("Basic"), default: type("Default") } },
    HelpNotify: { Use: true, Types: { basic: type("Basic"), diamond: type("Diamond"), hexagon: type("Hexagon") } },
    ProgressBar: { Use: true, Types: { basic: type("Basic"), diamond: type("Diamond"), modern: type("Modern") } }
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
