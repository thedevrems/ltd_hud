import { createStore } from "../core/state.js";
import { game } from "../core/gamestore.js";
import { config } from "../core/config.js";
import { el, animate } from "../core/dom.js";
import { liveLayer } from "../core/live-layer.js";
import { ui } from "../core/i18n.js";
import { VARIANTS } from "./notify-variants.js";

const EASING = "cubic-bezier(0.075, 0.82, 0.165, 1)";
const DURATION = 1000;
const DELAY = 400;
const DEFAULT_DURATION = 5000;
const DEMO_SERIAL = "position_notify";

const ENTER = {
    fade: { opacity: [0, 1] },
    zoom: { transform: ["scale(.3)", "scale(1)"], opacity: [0, 1] },
    from_left: { left: ["-100%", "0%"], opacity: [0, 1] },
    from_top: { top: ["-2vw", "0vw"], opacity: [0, 1] },
    from_right: { left: ["100%", "0%"], opacity: [0, 1] },
    from_bottom: { top: ["2vw", "0vw"], opacity: [0, 1] }
};

const LEAVE = {
    fade: { opacity: [1, 0] },
    zoom: { transform: ["scale(1)", "scale(.3)"], opacity: [1, 0] },
    from_left: { left: ["0%", "-100%"], opacity: [1, 0] },
    from_top: { top: ["0vw", "2vw"], opacity: [1, 0] },
    from_right: { left: ["0%", "100%"], opacity: [1, 0] },
    from_bottom: { top: ["0vw", "-2vw"], opacity: [1, 0] }
};

export const notify = createStore("notify", { currentActiveElement: false, list: {} });

let flatHost = null;
let riggedHost = null;
let mountedHost = null;
const rendered = new Map();

// 3d mode draws the queue inside the perspective rig rather than the flat corner
// block. Only one of the two hosts is ever on screen, so the mounted elements
// move between them instead of being rendered twice.
function activeHost() {
    return options()["3d-mode"] ? riggedHost : flatHost;
}

function reparent() {
    const host = activeHost();
    if (host === mountedHost) return;
    mountedHost = host;
    rendered.forEach(wrapper => host.appendChild(wrapper));
}

function addNotify(data) {
    notify.state.list[data.serial] = data;
    if (!notify.state.currentActiveElement) notify.state.currentActiveElement = notify.state.list[data.serial];
    notify.emit();
}

function removeNotify(data) {
    delete notify.state.list[data.serial];
    notify.state.currentActiveElement = Object.values(notify.state.list)[0];
    notify.emit();
}

function options() {
    return game.state.notifies.options;
}

// The placement screens replace the live queue with the build's stand-in.
function demoEntry() {
    return {
        serial: DEMO_SERIAL,
        duration: -1,
        header: ui("test_components.notification.header"),
        text: ui("test_components.notification.text"),
        icon: ui("test_components.notification.icon")
    };
}

// Entries the current mode should show: one at a time, or the whole list.
function visibleEntries() {
    if (!config.state.Notify.Use) return [];
    if (liveLayer.state.active) return [demoEntry()];
    if (options().list) {
        const active = notify.state.currentActiveElement;
        return active ? [active] : [];
    }
    return Object.values(notify.state.list);
}

// An unset animation fades late; an unknown name only collapses the height.
function playEnter(node) {
    animate(node, { maxHeight: [0, "10vw"] }, { duration: DURATION, easing: EASING });
    const name = options().animation;
    const frames = name ? ENTER[name] : ENTER.fade;
    if (frames) animate(node, frames, { duration: DURATION, easing: EASING, delay: DELAY });
}

function playLeave(node, done) {
    const closing = animate(node, { maxHeight: ["10vw", "0vw"] }, { duration: DURATION, easing: EASING });
    const name = options().animation;
    const frames = name ? LEAVE[name] : LEAVE.fade;
    if (frames) animate(node, frames, { duration: DURATION, easing: EASING, delay: name ? 0 : DELAY });
    if (closing) closing.onfinish = done;
    else done();
}

// Linear width fill drives the auto-dismiss, exactly as anime.js did.
function startProgress(node, data) {
    const bar = node.querySelector(".value-progress");
    if (!bar || data.duration === -1) return;
    const animation = animate(bar, { width: ["0%", "100%"] }, { duration: data.duration, easing: "linear" });
    if (animation) animation.onfinish = () => removeNotify({ serial: data.serial });
}

function createElement(data) {
    const wrapper = el("div", "notify-element");
    const build = VARIANTS[game.state.notifies.selected];
    if (build) wrapper.appendChild(build(data, options()));
    return wrapper;
}

function mountEntry(data) {
    const wrapper = createElement(data);
    rendered.set(data.serial, wrapper);
    mountedHost.appendChild(wrapper);
    playEnter(wrapper);
    startProgress(wrapper, data);
}

function unmountEntry(serial) {
    const wrapper = rendered.get(serial);
    rendered.delete(serial);
    playLeave(wrapper, () => wrapper.remove());
}

function render() {
    if (!mountedHost) return;
    const entries = visibleEntries();
    const serials = new Set(entries.map(entry => entry.serial));
    [...rendered.keys()].forEach(serial => {
        if (!serials.has(serial)) unmountEntry(serial);
    });
    entries.forEach(entry => {
        if (!rendered.has(entry.serial)) {
            mountEntry(Object.assign({}, entry, { duration: entry.duration || DEFAULT_DURATION }));
        }
    });
}

// Only the flat block carries the placed position and the player scale; the
// rigged one is laid out by the perspective stylesheet.
function applyContainer() {
    const slot = game.state.notifies;
    const threeD = !!slot.options["3d-mode"];
    flatHost.style.transform = `scale(${slot.scale})`;
    flatHost.style.display = threeD ? "none" : "flex";
    flatHost.style.left = slot.position.x ? slot.position.x + "px" : "";
    flatHost.style.top = slot.position.y ? slot.position.y + "px" : "6vw";
    riggedHost.parentNode.style.display = threeD ? "" : "none";
    reparent();
}

export function register(bus) {
    flatHost = document.getElementById("notify-content");
    riggedHost = document.getElementById("notify-3d");
    mountedHost = activeHost();
    bus.on("ADD_NOTIFY", data => addNotify({
        serial: data.serial, header: data.header, duration: data.duration, icon: data.icon, text: data.text
    }));
    bus.on("REMOVE_NOTIFY", data => removeNotify(data));
    notify.subscribe(render);
    liveLayer.subscribe(render);
    game.subscribe(() => {
        applyContainer();
        render();
    });
    applyContainer();
}
