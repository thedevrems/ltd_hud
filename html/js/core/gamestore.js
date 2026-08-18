import { createStore } from "./state.js";
import { writeComponent } from "./storage.js";
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

export const game = createStore("game", DEFAULTS);
const s = game.state;

// Persist a component slot and mirror it to Lua, as the Pinia action did.
export function updatedStorage(component) {
    writeComponent(component, s[component]);
    post("storage.onUpdate", { component, componentData: s[component] });
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

export function setMiniComponentVisibility(component, element, state) {
    if (!s[component]) return;
    s[component].visibility[element] = state;
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
