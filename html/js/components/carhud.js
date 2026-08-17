import {
    game, setComponentValue, setCarHudValues, setSeatbeltState, setUnfastenSeatbeltState
} from "../core/gamestore.js";
import { config } from "../core/config.js";
import { setInterfaceMetadata } from "../core/basestore.js";
import { el, clear, animate } from "../core/dom.js";
import sfx from "../core/sfx.js";
import { VARIANTS } from "./carhud-variants.js";

const EASING = "cubic-bezier(0.075, 0.82, 0.165, 1)";
const DURATION = 1000;

const ENTER = {
    fade: { opacity: [0, 1] },
    zoom: { opacity: [0, 1], transform: ["scale(.3)", "scale(1)"] },
    from_left: { opacity: [0, 1], transform: ["translateX(-6vw)", "translateX(0vw)"] },
    from_top: { opacity: [0, 1], transform: ["translateY(-6vw)", "translateY(0vw)"] },
    from_right: { opacity: [0, 1], transform: ["translateX(6vw)", "translateX(0vw)"] },
    from_bottom: { opacity: [0, 1], transform: ["translateY(6vw)", "translateY(0vw)"] }
};

const LEAVE = {
    fade: { opacity: [1, 0] },
    zoom: { opacity: [1, 0], transform: ["scale(1)", "scale(.3)"] },
    from_left: { opacity: [1, 0], transform: ["translateX(0vw)", "translateX(-6vw)"] },
    from_top: { opacity: [1, 0], transform: ["translateY(0vw)", "translateY(-6vw)"] },
    from_right: { opacity: [1, 0], transform: ["translateX(0vw)", "translateX(6vw)"] },
    from_bottom: { opacity: [1, 0], transform: ["translateY(0vw)", "translateY(6vw)"] }
};

let host = null;
let wrapper = null;
let node = null;
let selected = null;

// Everything the two variants read, flattened into one snapshot.
function view() {
    const slot = game.state.carhud;
    return Object.assign({}, slot.values, {
        metrics: config.state.Metrics,
        seatbelt: slot.seatbelt,
        unfastenSeatbelt: slot.unfastenSeatbelt,
        useSeatbelt: config.state.UseSeatbelt,
        strokeWidth: slot.options.strokeWidth
    });
}

function shouldShow() {
    return !!(game.state.carhud.isVisible && config.state.CarHud.Use);
}

// An unset animation fades; an unknown name leaves the element as it is.
function playEnter(target) {
    const name = game.state.carhud.options.animation;
    const frames = name ? ENTER[name] : ENTER.fade;
    if (frames) animate(target, frames, { duration: DURATION, easing: EASING });
}

function playLeave(target, done) {
    const name = game.state.carhud.options.animation;
    const frames = name ? LEAVE[name] : LEAVE.fade;
    const leaving = frames ? animate(target, frames, { duration: DURATION, easing: EASING }) : null;
    if (leaving) leaving.onfinish = done;
    else done();
}

// The measured box feeds the position screen, as the build's mounted() did.
function buildVariant() {
    selected = game.state.carhud.selected;
    const build = VARIANTS[selected];
    node = build ? build() : null;
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
    onChanged();
}
