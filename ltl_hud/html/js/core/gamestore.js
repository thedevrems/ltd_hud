import { createStore } from "./state.js";
import { writeComponent, keyFor } from "./storage.js";
import { post } from "./nui.js";

const ANIMATION_CLEANUP = 300;

const DEFAULTS = {
    color: {
        primaryColor: "#ee1c3e", primaryBackground: "#000000", backgroundColor: "#242424",
        primaryBackgroundOpacity: .3, backgroundColorOpacity: .25, useCustomHudColors: false,
        hud: { health: "#ee1c3e", hunger: "#ee1c3e", thirst: "#ee1c3e" }
    },
    hud: {
        animationsList: {}, selected: "square", isVisible: true,
        options: { "3d-mode": false, shadows: false, iconShadow: true, smoothEdges: false, under50: false },
        values: {}, visibility: false, scale: 1,
        position: { minimap_on: { x: false, y: false }, minimap_off: { x: false, y: false } },
        refreshInterval: { current: 100, min: 0, max: 1000 }
    },
    carhud: {
        selected: "default", isVisible: false,
        values: { rpm: 0, speed: 0, gear: 1, fuel: 20, engine: 100 },
        seatbelt: false, unfastenSeatbelt: false,
        options: { shadows: false, animation: "from_right", strokeWidth: 40 },
        position: { x: false, y: false },
        refreshInterval: { current: 125, min: 0, max: 250 }
    },
    notifies: {
        selected: "diamond",
        options: { "3d-mode": false, smoothEdges: false, list: false, shadows: false, animation: "from_right" },
        position: { x: false, y: false }
    },
    helpNotify: {
        selected: "diamond",
        options: { shadows: false, background: false, smoothEdges: false, animation: "fade" }
    },
    progressBar: {
        selected: "diamond",
        options: { "3d-mode": false, shadows: false, animation: "fade" },
        position: { x: false, y: false }
    },
    misc: {
        options: {
            use_minimap_overlay: false, minimap_outline: false, minimap_innershadow: false,
            minimap_animation: "default", disable_3d_me: false
        },
        musicData: { author: "", title: "" }
    }
};

// Ce qui, dans chaque créneau, mérite de survivre à la déconnexion. Le reste de
// l'état d'un composant est vivant — `values`, `animationsList`, `isVisible`
// changent plusieurs fois par seconde et sont reconstruits au démarrage — et
// l'écrire en base grossirait la ligne sans que rien ne la relise. Cette liste
// est le miroir exact de ce que bootstrap.js et setStorage reprennent.
const PERSISTED = {
    hud: ["selected", "options", "position", "scale", "refreshInterval", "visibility"],
    carhud: ["selected", "options", "position", "scale", "refreshInterval"],
    notifies: ["selected", "options", "position", "scale"],
    progressBar: ["selected", "options", "position", "scale"],
    helpNotify: ["selected", "options"],
    misc: ["options"],
    color: [
        "primaryColor", "primaryBackground", "backgroundColor",
        "primaryBackgroundOpacity", "backgroundColorOpacity", "useCustomHudColors", "hud"
    ]
};

export const game = createStore("game", DEFAULTS);
const s = game.state;

function snapshot(component) {
    const keys = PERSISTED[component];
    if (!keys) return s[component];
    const out = {};
    keys.forEach(key => { if (s[component][key] !== undefined) out[key] = s[component][key]; });
    return out;
}

// Persist a component slot and mirror it to Lua, as the Pinia action did. The
// slot name travels alongside the component name because the two differ
// (`progressBar` in memory, `progressbar` in the database) and Lua needs the
// second one to name the key it writes.
export function updatedStorage(component) {
    const data = snapshot(component);
    writeComponent(component, data);
    post("storage.onUpdate", { component, componentData: data, slot: keyFor(component) });
    game.emit();
}

// Reprend la couleur résolue au démarrage — base de données ou config serveur.
// C'est une lecture, pas une modification : la faire passer par setColor
// renverrait sept écritures au serveur à chaque connexion, et créerait une ligne
// en base pour un joueur qui n'a encore rien réglé.
export function seedColor(color) {
    Object.assign(s.color, color);
    game.emit();
}

export function setColor(key, value) {
    s.color[key] = value;
    updatedStorage("color");
}

export function setComponentColor(group, key, value) {
    s.color[group][key] = value;
    updatedStorage("color");
}

export function setStorage(payload) {
    applySlot("hud", payload.hud, true);
    applySlot("carhud", payload.carhud, true);
    applySlot("notifies", payload.notify, true);
    applySlot("progressBar", payload.progressbar, true);
    applySlot("helpNotify", payload.helpnotify, false);
    s.misc.options = payload.misc.options;
    game.emit();
}

function applySlot(name, source, withPosition) {
    s[name].selected = source.selected;
    s[name].options = source.options;
    if (!withPosition) return;
    s[name].position = source.position;
    s[name].scale = source.scale || 1;
}

export function setType(component, value) {
    if (!s[component]) return;
    s[component].selected = value;
    updatedStorage(component);
}

export function setOption(component, key, value) {
    if (!s[component]) return;
    s[component].options[key] = value;
    updatedStorage(component);
}

export function setRefreshIntervals(component, value) {
    if (!s[component] || !s[component].refreshInterval) return;
    s[component].refreshInterval.current = value;
    updatedStorage(component);
}

export function setElementScale(component, value) {
    if (!s[component]) return;
    if (!s[component].scale) {
        s[component].scale = 1;
        return;
    }
    s[component].scale = value;
    updatedStorage(component);
}

export function setComponentPosition(component, key, value) {
    if (!s[component] || !s[component].position) return;
    if (key && !s[component].position[key]) return;
    if (!value) return;
    if (key) s[component].position[key] = value;
    else s[component].position = value;
    updatedStorage(component);
}

export function setComponentValue(component, key, value) {
    if (!s[component]) return;
    s[component].values[key] = value;
    game.emit();
}

export function setCarHudValues(values) {
    s.carhud.values = values;
    game.emit();
}

export function setSeatbeltState(state) {
    s.carhud.seatbelt = state;
    game.emit();
}

export function setUnfastenSeatbeltState(state) {
    s.carhud.unfastenSeatbelt = state;
    game.emit();
}

export function setComponentVisibility(component, state) {
    if (!s[component]) return;
    s[component].isVisible = state;
    game.emit();
}

export function setMiniComponentsList(component, list) {
    s[component].visibility = list;
    game.emit();
}

// Cocher un statut dans les réglages est une modification comme une autre, donc
// elle part en base comme les autres. Elle ne le faisait pas : la case revenait
// à la valeur de Config.Hud.Status à la reconnexion, sans que rien ne signale
// que le choix avait été perdu.
export function setMiniComponentVisibility(component, element, state) {
    if (!s[component]) return;
    s[component].visibility[element] = state;
    if (PERSISTED[component] && PERSISTED[component].includes("visibility")) {
        return updatedStorage(component);
    }
    game.emit();
}

export function onRegisteredStatus(name) {
    s.color.hud[name] = s.color.primaryColor;
    game.emit();
}

export function onUnregisteredStatus(name) {
    delete s.color.hud[name];
    game.emit();
}

export function positionUpdated(component, position, width, height) {
    post("storage.onPositionUpdate", { component, position, width, height });
}

export function resetComponentsPosition() {
    s.hud.position = { minimap_on: { x: false, y: false }, minimap_off: { x: false, y: false } };
    s.carhud.position = { x: false, y: false };
    s.notifies.position = { x: false, y: false };
    s.progressBar.position = { x: false, y: false };
    ["hud", "carhud", "notifies", "progressBar"].forEach(updatedStorage);
}

export function resetScale() {
    ["hud", "carhud", "notifies", "progressBar"].forEach(component => {
        s[component].scale = 1;
        updatedStorage(component);
    });
}

// APPLY_EFFECT_ON_INTERFACE queues a flag that self-clears once released.
export function addQueueToAnimationsList(name, element, state) {
    if (!s[name] || !s[name].animationsList) return;
    s[name].animationsList[element] = state;
    game.emit();
    if (state) return;
    setTimeout(() => {
        delete s[name].animationsList[element];
        game.emit();
    }, ANIMATION_CLEANUP);
}

export function sendToLUA() {
    post("storage.nuiRetrieve", { hud: s.hud, carhud: s.carhud, notifies: s.notifies });
}
