import { createStore } from "../core/state.js";
import { game } from "../core/gamestore.js";
import { config } from "../core/config.js";
import { el, animate } from "../core/dom.js";
import { VARIANTS } from "./notify-variants.js";

const EASING = "cubic-bezier(0.075, 0.82, 0.165, 1)";
const DURATION = 1000;
const DELAY = 400;
const DEFAULT_DURATION = 5000;

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

let host = null;
const rendered = new Map();

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

// Entries the current mode should show: one at a time, or the whole list.
function visibleEntries() {
    if (!config.state.Notify.Use) return [];
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
    host.appendChild(wrapper);
    playEnter(wrapper);
    startProgress(wrapper, data);
}

function unmountEntry(serial) {
    const wrapper = rendered.get(serial);
    rendered.delete(serial);
    playLeave(wrapper, () => wrapper.remove());
}

function render() {
    if (!host) return;
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

function applyContainer() {
    const slot = game.state.notifies;
    host.style.transform = `scale(${slot.scale})`;
    host.style.display = slot.options["3d-mode"] ? "none" : "flex";
    host.style.left = slot.position.x ? slot.position.x + "px" : "";
    host.style.top = slot.position.y ? slot.position.y + "px" : "6vw";
}

export function register(bus) {
    host = document.getElementById("notify-content");
    bus.on("ADD_NOTIFY", data => addNotify({
        serial: data.serial, header: data.header, duration: data.duration, icon: data.icon, text: data.text
    }));
    bus.on("REMOVE_NOTIFY", data => removeNotify(data));
    notify.subscribe(render);
    game.subscribe(() => {
        applyContainer();
        render();
    });
    applyContainer();
}
