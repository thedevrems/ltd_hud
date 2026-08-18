import {
    game, setComponentValue, setMiniComponentsList, onRegisteredStatus, onUnregisteredStatus
} from "../core/gamestore.js";
import { config, registerHudStatus, unregisterHudStatus } from "../core/config.js";
import { minimap } from "../core/minimapstore.js";
import { setClass } from "../core/dom.js";
import { createList } from "./hud-list.js";

const REGISTER_DELAY = 300;

let flatHost = null;
let holdContent = null;
let lists = [];
let defaultLeft = 0;
let statusKey = "";
let effectSnapshot = "";

function statuses() {
    return Object.values(config.state.Hud.Status);
}

// A late status joins the hud first and only then reports itself to Lua.
function handleRegister(data) {
    const visibility = game.state.hud.visibility;
    if (data.register) {
        registerHudStatus(data.statusName, data.statusData);
        visibility[data.statusName] = data.statusVisible;
        setTimeout(() => onRegisteredStatus(data.statusName), REGISTER_DELAY);
    } else {
        unregisterHudStatus(data.statusName);
        if (visibility[data.statusName]) delete visibility[data.statusName];
        setTimeout(() => onUnregisteredStatus(data.statusName), REGISTER_DELAY);
    }
    setMiniComponentsList("hud", visibility);
}

function displayMode(slot) {
    if (!config.state.Hud.Use || slot.options["3d-mode"]) return "none";
    return slot.isVisible ? "flex" : "none";
}

function flexDirection(slot) {
    if (slot.options["3d-mode"]) return "row";
    return slot.options.vertical ? "column" : "row";
}

// Centring is measured only when the status set changes, as the build did.
function refreshDefaultLeft() {
    const key = Object.keys(config.state.Hud.Status).join(",");
    if (key === statusKey) return;
    statusKey = key;
    const rect = flatHost.getBoundingClientRect();
    defaultLeft = (window.innerWidth - rect.width) / 2 / window.innerWidth * 100;
}

function applyContainer() {
    const slot = game.state.hud;
    const position = slot.position[minimap.state.isVisible ? "minimap_on" : "minimap_off"];
    setClass(flatHost, "diamondGap", slot.name === "diamond");
    flatHost.style.transform = `scale(${slot.scale})`;
    flatHost.style.display = displayMode(slot);
    flatHost.style.flexDirection = flexDirection(slot);
    flatHost.style.left = position.x ? position.x + "px" : defaultLeft + "%";
    flatHost.style.top = position.y ? position.y + "px" : "calc(100% - 4vw)";
}

// The 3D twin only exists while 3d-mode is on and the hud stays enabled.
function applyHold() {
    const slot = game.state.hud;
    holdContent.style.display = slot.options["3d-mode"] && config.state.Hud.Use ? "" : "none";
}

function applyEffects() {
    const queue = game.state.hud.animationsList;
    const snapshot = JSON.stringify(queue);
    if (snapshot === effectSnapshot) return;
    effectSnapshot = snapshot;
    for (const name in queue) lists.forEach(list => list.lift(name, queue[name]));
}

function render() {
    const slot = game.state.hud;
    lists.forEach(list => list.sync(statuses(), slot, game.state.color));
    refreshDefaultLeft();
    applyContainer();
    applyHold();
    applyEffects();
}

export function register(bus) {
    flatHost = document.getElementById("hud-content");
    holdContent = document.getElementById("hold-content");
    lists = [createList(flatHost), createList(document.getElementById("hud-3d"))];
    bus.on("UPDATE_HUD_VALUE", data => setComponentValue("hud", data.key, data.value));
    bus.on("HANDLE_REGISTER_STATUS_HUD", data => handleRegister(data));
    game.subscribe(render);
    config.subscribe(render);
    minimap.subscribe(applyContainer);
    render();
}
