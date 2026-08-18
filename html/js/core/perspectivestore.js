import { createStore } from "./state.js";
import { post } from "./nui.js";

const REVEAL_DELAY = 250;
const TICK = 100;
const DONE_HOLD = 1000;
const DROP_DELAY = 500;

export const perspective = createStore("perspective", {
    rotationOffsets: { x: 0, y: -20, z: 0 },
    isVisible: false,
    inVeh: false,
    weaponIndicator: { use: false, name: "Pistol", ammo: { current: 12, max: 20, magazine: 356 } },
    textui_list: {},
    status: { sprint: { visible: false, value: 40 }, oxygen: { visible: false, value: 85 } }
});

const list = perspective.state.textui_list;

export function setRotationOffset(offsets) {
    perspective.state.rotationOffsets = offsets;
    perspective.emit();
}

export function setInVeh(state) {
    perspective.state.inVeh = state;
    perspective.emit();
}

export function setVisible(state) {
    perspective.state.isVisible = state;
    perspective.emit();
}

export function setStatusValue(key, value) {
    perspective.state.status[key].value = value;
    perspective.emit();
}

export function setStatusVisibility(key, state) {
    perspective.state.status[key].visible = state;
    perspective.emit();
}

export function setWeaponIndicatorState(state) {
    perspective.state.weaponIndicator.use = state;
    perspective.emit();
}

export function setWeaponIndicatorName(name) {
    perspective.state.weaponIndicator.name = name;
    perspective.emit();
}

// The ammo payload replaces the whole block: current, max and magazine.
export function setWeaponIndicatorAmmo(ammo) {
    perspective.state.weaponIndicator.ammo = ammo;
    perspective.emit();
}

// Progress drains over the entry duration; running dry reports the missed key press.
function startCountdown(serial, text, duration) {
    const step = 100 / (duration / TICK);
    const interval = setInterval(() => {
        const entry = list[serial];
        if (!entry) return clearInterval(interval);
        if (entry.progress <= 0) {
            clearInterval(interval);
            return post("textui.forceRemoveOnFailure", { serial, text });
        }
        entry.progress = Math.max(0, entry.progress - step);
        perspective.emit();
    }, TICK);
    return interval;
}

function reveal(serial, text, duration) {
    const entry = list[serial];
    if (!entry) return;
    entry.visible = true;
    if (duration > 0) entry.interval = startCountdown(serial, text, duration);
    perspective.emit();
}

export function addTextUIElement(serial, key, text, duration) {
    list[serial] = { key, text, duration, progress: 100 };
    perspective.emit();
    setTimeout(() => reveal(serial, text, duration), REVEAL_DELAY);
}

// Only fields that already hold a truthy value can be patched, as in the build.
export function updateTextUI(serial, key, value) {
    const entry = list[serial];
    if (!entry || !entry[key]) return;
    entry[key] = value;
    perspective.emit();
}

function hideEntry(serial) {
    const entry = list[serial];
    if (!entry) return;
    entry.visible = false;
    perspective.emit();
    setTimeout(() => {
        delete list[serial];
        perspective.emit();
    }, DROP_DELAY);
}

// A successful press holds the "done" highlight before the entry fades away.
export function removeTextUIElement(serial, anim) {
    const entry = list[serial];
    if (!entry) return;
    if (entry.interval) clearInterval(entry.interval);
    if (!anim) return hideEntry(serial);
    entry.done = true;
    perspective.emit();
    setTimeout(() => hideEntry(serial), DONE_HOLD);
}
