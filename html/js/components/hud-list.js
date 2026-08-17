import { el, setClasses, animate } from "../core/dom.js";
import { VARIANTS, updateVariant } from "./hud-variants.js";

const EASING = "cubic-bezier(0.075, 0.82, 0.165, 1)";
const DURATION = 1000;
const LIFT = "translateY(-0.5vw)";

const ENTER = {
    maxWidth: ["0px", "2.5vw"], marginRight: ["0px", ".5vw"],
    transform: ["translateY(-2vw)", "translateY(0vw)"], opacity: [0, 1]
};

const LEAVE = {
    marginRight: [".5vw", "0px"], maxWidth: ["2.5vw", "0px"],
    transform: ["translateY(0vw)", "translateY(-2vw)"], opacity: [1, 0]
};

function colorOf(colors, name) {
    return colors.useCustomHudColors ? colors.hud[name] : colors.primaryColor;
}

function play(node, frames) {
    return animate(node, frames, { duration: DURATION, easing: EASING });
}

// The first render lands without a transition, exactly like the build's group.
function mount(host, rows, view, status, animated) {
    const wrapper = el("div", "hud-element convert-hud-element");
    if (view) wrapper.appendChild(view.root);
    host.appendChild(wrapper);
    rows.set(status.name, { wrapper, view });
    if (animated) play(wrapper, ENTER);
}

function unmount(rows, name) {
    const row = rows.get(name);
    rows.delete(name);
    const leaving = play(row.wrapper, LEAVE);
    if (leaving) leaving.onfinish = () => row.wrapper.remove();
    else row.wrapper.remove();
}

function rebuild(rows) {
    rows.forEach(row => row.wrapper.remove());
    rows.clear();
}

function refresh(rows, status, slot, colors) {
    const row = rows.get(status.name);
    const visible = slot.visibility[status.name];
    setClasses(row.wrapper, {
        "is-visible": visible && !slot.options.vertical,
        "is-visible-col": visible && slot.options.vertical
    });
    if (row.view) updateVariant(row.view, slot.values[status.name], colorOf(colors, status.name), slot.options);
}

// The build tags the trailing row so it drops its trailing gap.
function markLast(host) {
    const visible = host.querySelectorAll(".convert-hud-element.is-visible");
    visible.forEach(node => node.classList.remove("last-visible"));
    if (visible.length) visible[visible.length - 1].classList.add("last-visible");
}

function drain(rows, names) {
    [...rows.keys()].forEach(name => {
        if (!names.includes(name)) unmount(rows, name);
    });
}

function sync(host, rows, memo, statuses, slot, colors) {
    if (slot.selected !== memo.selected) {
        memo.selected = slot.selected;
        rebuild(rows);
    }
    drain(rows, statuses.map(status => status.name));
    const build = VARIANTS[memo.selected];
    statuses.forEach(status => {
        if (!rows.has(status.name)) mount(host, rows, build ? build(status.icon) : null, status, !memo.first);
        refresh(rows, status, slot, colors);
    });
    markLast(host);
    memo.first = false;
}

// APPLY_EFFECT_ON_INTERFACE nudges one row up, then releases it.
function lift(rows, name, active) {
    const row = rows.get(name);
    if (!row) return;
    play(row.wrapper, { transform: active ? LIFT : "translateY(0)" });
}

// One row list per host: the flat hud and its 3D twin each own one.
export function createList(host) {
    const rows = new Map();
    const memo = { selected: null, first: true };
    return {
        sync: (statuses, slot, colors) => sync(host, rows, memo, statuses, slot, colors),
        lift: (name, active) => lift(rows, name, active)
    };
}
