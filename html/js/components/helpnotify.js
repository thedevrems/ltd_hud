import { createStore } from "../core/state.js";
import { game } from "../core/gamestore.js";
import { config } from "../core/config.js";
import { clear, setClasses } from "../core/dom.js";
import { VARIANTS, updateVariant } from "./helpnotify-variants.js";

const ANIMATIONS = ["fade", "zoom", "from_left", "from_top"];

export const helpNotify = createStore("helpnotify", {
    current: false,
    options: {
        basic: { shadows: true, smoothEdges: true, background: true },
        diamond: { shadows: true, smoothEdges: false, background: false },
        hexagon: { shadows: true, smoothEdges: true, background: true }
    }
});

let host = null;
let view = null;
let selected = null;

function add(data) {
    helpNotify.state.current = data;
    helpNotify.emit();
}

function remove() {
    helpNotify.state.current = false;
    helpNotify.emit();
}

function updateText(data) {
    if (!helpNotify.state.current) return;
    helpNotify.state.current.text = data.text;
    helpNotify.emit();
}

// Stages are addressed by name, with the loose comparison the build used.
function updateStage(data) {
    const current = helpNotify.state.current;
    if (!current || current.text === null || typeof current.text !== "object") return;
    Object.values(current.text).forEach(stage => {
        if (stage.name == data.stage) stage[data.key] = data.value;
    });
    helpNotify.emit();
}

function mountVariant() {
    selected = game.state.helpNotify.selected;
    clear(host);
    const build = VARIANTS[selected];
    view = build ? build() : null;
    if (view) host.appendChild(view.root);
}

// The pre_ class arms the animation and its twin plays it once a notify lands.
function renderContainer() {
    const animation = game.state.helpNotify.options.animation;
    const active = helpNotify.state.current !== false;
    const classes = {};
    ANIMATIONS.forEach(name => {
        classes["pre_" + name] = animation === name;
        classes[name] = active && animation === name;
    });
    setClasses(host, classes);
    host.style.display = config.state.HelpNotify.Use ? "" : "none";
}

function render() {
    renderContainer();
    if (view) updateVariant(view, helpNotify.state.current || {}, game.state.helpNotify.options);
}

function onStorageChanged() {
    if (game.state.helpNotify.selected !== selected) mountVariant();
    render();
}

export function register(bus) {
    host = document.getElementById("helpnotify-content");
    bus.on("ADD_HELP_NOTIFY", data => add(data));
    bus.on("REMOVE_HELP_NOTIFY", () => remove());
    bus.on("UPDATE_HELP_NOTIFY_TEXT", data => updateText(data));
    bus.on("UPDATE_HELP_NOTIFY_STAGE", data => updateStage(data));
    helpNotify.subscribe(render);
    game.subscribe(onStorageChanged);
    config.subscribe(render);
    mountVariant();
    render();
}
