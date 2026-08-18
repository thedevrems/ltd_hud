import {
    game, setComponentValue, setCarHudValues, setSeatbeltState, setUnfastenSeatbeltState
} from "../core/gamestore.js";
import { config } from "../core/config.js";
import { setInterfaceMetadata } from "../core/basestore.js";
import { el, clear } from "../core/dom.js";
import { liveLayer } from "../core/live-layer.js";
import sfx from "../core/sfx.js";
import { ENTER_FRAMES, LEAVE_FRAMES, playFrames } from "../core/animations.js";
import { VARIANTS } from "./carhud-variants.js";

// The readout the build froze into the placement screens: a parked car reads
// zero everywhere, which leaves nothing recognisable to drag around.
const DEMO = { speed: 92, rpm: 50, fuel: 34, gear: 3, engine: 100, seatbelt: false, unfastenSeatbelt: false };

let host = null;
let wrapper = null;
let node = null;
let selected = null;

// Everything the two variants read, flattened into one snapshot.
function view() {
    const slot = game.state.carhud;
    const live = liveLayer.state.active;
    return Object.assign({}, live ? DEMO : slot.values, {
        metrics: config.state.Metrics,
        seatbelt: live ? DEMO.seatbelt : slot.seatbelt,
        unfastenSeatbelt: live ? DEMO.unfastenSeatbelt : slot.unfastenSeatbelt,
        useSeatbelt: config.state.UseSeatbelt,
        strokeWidth: slot.options.strokeWidth
    });
}

// Placing the dial never waits for the player to sit in a car.
function shouldShow() {
    if (!config.state.CarHud.Use) return false;
    return liveLayer.state.active || !!game.state.carhud.isVisible;
}

function playEnter(target) {
    playFrames(ENTER_FRAMES, target, game.state.carhud.options.animation);
}

function playLeave(target, done) {
    const leaving = playFrames(LEAVE_FRAMES, target, game.state.carhud.options.animation);
    if (leaving) leaving.onfinish = done;
    else done();
}

// The measured box feeds the position screen, as the build's mounted() did.
function buildVariant() {
    selected = game.state.carhud.selected;
    const build = VARIANTS[selected];
    node = build ? build(true) : null;
    if (!node) return;
    wrapper.appendChild(node.root);
    node.apply(view());
    setInterfaceMetadata("carhud", selected, node.root.getBoundingClientRect());
}

function mount() {
    wrapper = el("div", "carhud-preelement");
    host.appendChild(wrapper);
    buildVariant();
    playEnter(wrapper);
}

function unmount() {
    const leaving = wrapper;
    wrapper = null;
    node = null;
    playLeave(leaving, () => leaving.remove());
}

// Switching preset swaps the inner element without replaying the transition.
function swapVariant() {
    clear(wrapper);
    buildVariant();
}

function render() {
    const show = shouldShow();
    if (show && !wrapper) return mount();
    if (!show && wrapper) return unmount();
    if (!wrapper) return;
    if (game.state.carhud.selected !== selected) return swapVariant();
    if (node) node.apply(view());
}

function applyContainer() {
    const slot = game.state.carhud;
    host.style.transform = `scale(${slot.scale || 1})`;
    host.style.left = slot.position.x ? slot.position.x + "px" : "";
    host.style.top = slot.position.y ? slot.position.y + "px" : "";
}

function onSeatbelt(data) {
    setSeatbeltState(data.state);
    if (!data.sfx) return;
    sfx[data.state ? "buckle" : "unbuckle"].play();
}

function onUnfasten(data) {
    setUnfastenSeatbeltState(data.state);
    sfx.unfasten[data.state ? "play" : "stop"]();
}

function onChanged() {
    applyContainer();
    render();
}

export function register(bus) {
    host = document.getElementById("carhud-content");
    bus.on("UPDATE_CARHUD_VALUE", data => setComponentValue("carhud", data.key, data.value));
    bus.on("SET_CARHUD_VALUES", data => setCarHudValues(data));
    bus.on("SET_CARHUD_SEATBELT", data => onSeatbelt(data));
    bus.on("INDICATE_UNFASTEN_SEATBELT", data => onUnfasten(data));
    game.subscribe(onChanged);
    config.subscribe(onChanged);
    liveLayer.subscribe(onChanged);
    onChanged();
}
