import { setClass } from "./dom.js";
import { makeDraggable } from "./drag.js";
import { minimap } from "./minimapstore.js";
import { setComponentPosition, positionUpdated } from "./gamestore.js";

const HOSTS = ["hud-content", "notify-content", "carhud-content", "minimap-data", "top-left-content", "progress-root"];
const TARGETS = [
    { name: "hud", slot: "hud", id: "hud-content" },
    { name: "notify", slot: "notifies", id: "notify-content" },
    { name: "carhud", slot: "carhud", id: "carhud-content" },
    { name: "progressBar", slot: "progressBar", id: "progress-root" }
];

const origins = new Map();
let owner = null;
let armed = false;

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
}

export function releaseLiveLayer(screen) {
    if (!owner || owner.screen !== screen) return;
    owner = null;
    HOSTS.forEach(id => moveHost(id, null));
}
