import { setClass } from "./dom.js";
import { createStore } from "./state.js";
import { makeDraggable } from "./drag.js";
import { minimap } from "./minimapstore.js";
import { setComponentPosition, positionUpdated } from "./gamestore.js";
import { provide } from "./debug.js";

const HOSTS = [
    "hud-content", "notify-content", "carhud-content", "minimap-data",
    "top-left-content", "top-right-content", "progress-root"
];
const TARGETS = [
    { name: "hud", slot: "hud", id: "hud-content" },
    { name: "notify", slot: "notifies", id: "notify-content" },
    { name: "carhud", slot: "carhud", id: "carhud-content" },
    { name: "progressBar", slot: "progressBar", id: "progress-root" }
];

// Nothing is running while the player places the components: no notification is
// queued, the car is parked, no progress bar is filling. The build mounted a
// stand-in for each one on "/position" and "/preview" rather than the live
// element, so the placeable components watch this flag and do the same.
export const liveLayer = createStore("live-layer", { active: false });

const origins = new Map();
let owner = null;
let armed = false;

provide("liveLayer", () => ({
    active: liveLayer.state.active,
    owner: owner ? owner.screen.id || owner.screen.className : null,
    hosts: HOSTS.map(id => {
        const node = document.getElementById(id);
        return id + " -> " + (node ? node.parentNode.id || node.parentNode.className : "MISSING FROM DOM");
    })
}));

export function slotOf(name) {
    const target = TARGETS.find(entry => entry.name === name);
    return target ? target.slot : name;
}

// The hud keeps one position per minimap state; the others keep a single one.
function positionKey(name) {
    if (name !== "hud") return false;
    return minimap.state.isVisible ? "minimap_on" : "minimap_off";
}

function markDragging(target, state) {
    if (!owner) return;
    setClass(owner.screen, "dragging", state);
    setClass(owner.screen, "dragging-" + target.name, state);
}

function onDragEnd(target, position, rect) {
    positionUpdated(target.slot, position, rect.width, rect.height);
    setComponentPosition(target.slot, positionKey(target.name), position);
    markDragging(target, false);
}

// Both screens share one set of handlers, so a component never gets armed twice.
function armTargets() {
    if (armed) return;
    armed = true;
    TARGETS.forEach(target => {
        const node = document.getElementById(target.id);
        if (!node) return;
        makeDraggable(node, {
            onDrag: () => markDragging(target, true),
            onDragEnd: (position, rect) => onDragEnd(target, position, rect),
            onClick: () => { if (owner) owner.onSelect(target.name); }
        });
    });
}

function moveHost(id, screen) {
    const node = document.getElementById(id);
    if (!node) return;
    if (!origins.has(id)) origins.set(id, node.parentNode);
    (screen || origins.get(id)).appendChild(node);
}

// The screen borrows the live game layer instead of mounting a second copy.
export function claimLiveLayer(screen, onSelect) {
    armTargets();
    owner = { screen, onSelect };
    HOSTS.forEach(id => moveHost(id, screen));
    // Flipped after the move so the stand-ins mount inside the screen, not the game layer.
    liveLayer.set("active", true);
}

export function releaseLiveLayer(screen) {
    if (!owner || owner.screen !== screen) return;
    owner = null;
    HOSTS.forEach(id => moveHost(id, null));
    liveLayer.set("active", false);
}
