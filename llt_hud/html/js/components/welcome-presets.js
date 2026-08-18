import { el, svgEl, setText } from "../core/dom.js";
import { register as registerScreen, push, current } from "../core/screens.js";
import { post } from "../core/nui.js";
import { writeJSON } from "../core/storage.js";
import { language, ui } from "../core/i18n.js";
import { scoped, provide } from "../core/debug.js";
import sfx from "../core/sfx.js";

const debug = scoped("presets");

const PATH = "/welcome/presets";
const CHOICE_DELAY = 5000;
// How long after applying the preset we re-read the game layer, to catch a
// handshake that never arrived rather than a transition still running.
const VERIFY_DELAY = 2000;
const CROSS = { d: "M14 2L2 14M2 2L14 14", stroke: "black", "stroke-width": "4" };
const BRAID = [
    "M2 27.5L22 7.5M2 7.5L22 27.5",
    "M58 27L78 7M58 7L78 27",
    "M25 32L55 2M25 2L55 32"
];
const PRESETS = [
    { name: "server_preset", recommended: true, header: "presets.presets", text: "presets.presets_text" },
    { name: "user_preset", recommended: false, header: "presets.manual_customize", text: "presets.manual_customize_text" }
];

let screen = null;
let cards = [];
let lastChoice = null;
let choiceTimer = null;

function crossIcon() {
    const icon = el("div", "icon");
    const svg = svgEl("svg", { viewBox: "0 0 16 16", fill: "none" });
    svg.appendChild(svgEl("path", CROSS));
    icon.appendChild(svg);
    return icon;
}

function braidIcon() {
    const icon = el("div", "icon");
    const svg = svgEl("svg", { viewBox: "0 0 80 34", fill: "none" });
    BRAID.forEach(d => svg.appendChild(svgEl("path", { d, stroke: "black", "stroke-opacity": "0.3", "stroke-width": "4" })));
    icon.appendChild(svg);
    return icon;
}

function ribbon(spec, card) {
    if (!spec.recommended) {
        card.appendChild(el("div", "blank"));
        return null;
    }
    const row = el("div", "recommended");
    const label = el("div", "text");
    row.append(crossIcon(), label);
    card.appendChild(row);
    return label;
}

function buildCard(spec) {
    const card = el("div", "preset");
    const badge = ribbon(spec, card);
    const header = el("div", "header");
    const content = el("div", "text-content");
    const text = el("div", "text");
    content.append(braidIcon(), text);
    card.append(header, content);
    card.onmouseover = () => sfx.woosh.play();
    card.onclick = () => onChoice(spec.name);
    return { spec, root: card, badge, header, text };
}

// The server preset skips the customisation flow and marks the UI as created.
//
// Unlike the manual path, nothing here goes through Lua's preview teardown, so
// the only two things that reach the client are the route change (which Lua sees
// as storage.switchedScreen "game") and storage.setCreatedUI. Each step is
// traced because a silent failure in any of them leaves an empty screen.
function applyServerPreset() {
    debug.log("applying server preset: skipping /welcome/customize entirely");
    sfx.enter_welcome.play();

    debug.log('step 1/3 -> push("/") (Lua will receive storage.switchedScreen {path:"game"})');
    push("/");

    debug.log('step 2/3 -> post("storage.setCreatedUI") (unblocks Storage.Data.createdUI on the client)');
    post("storage.setCreatedUI", {});

    debug.log('step 3/3 -> writeJSON("UIConfigured", true) (the welcome flow is skipped on the next spawn)');
    writeJSON("UIConfigured", true);

    // Nothing in this path asks Lua for SET_UI_VISIBLE, so verify what is on screen.
    setTimeout(verify, VERIFY_DELAY);
}

// Re-reads the live DOM and states plainly which link of the chain is missing.
function verify() {
    const report = debug.dump("after-server-preset");
    const visibility = report.visibility || {};
    const gameScreen = report.gameScreen || {};

    if (current() !== "/") {
        return debug.error(`route is "${current()}" instead of "/": the game layer is not the active screen`);
    }
    if (!gameScreen.isActive) {
        return debug.error('#game-screen has no "is-active" class: the router did not mount the game layer');
    }
    if (!visibility.isGameVisible) {
        return debug.error(
            "the game layer is mounted but hidden: base.isGameVisible is false, so every hud layer sits at opacity 0. " +
            'Lua never sent SET_UI_VISIBLE {state=true} (NUI.SetUIVisible) — check that ltl_hud:Client:LoadPlayer ' +
            "fired AFTER the NUI was loaded, and see /hud_debug on the client."
        );
    }
    debug.log("game layer is visible; if the hud is still empty the values come from Threads.Hud (client side)", gameScreen.layers);
}

function onChoice(name) {
    if (choiceTimer) {
        return debug.warn(`choice "${name}" ignored: "${lastChoice}" is already running`);
    }
    lastChoice = name;
    debug.log(`card clicked: "${name}" — waiting ${CHOICE_DELAY}ms before applying`);
    sfx.plum.play();
    push("/welcome");
    choiceTimer = setTimeout(() => {
        choiceTimer = null;
        debug.log(`delay elapsed, resolving choice "${name}"`);
        if (name === "server_preset") return applyServerPreset();
        debug.log('user preset chosen -> push("/welcome/customize")');
        push("/welcome/customize");
    }, CHOICE_DELAY);
}

function render() {
    cards.forEach(card => {
        if (card.badge) setText(card.badge, ui("presets.recommended"));
        setText(card.header, ui(card.spec.header));
        setText(card.text, ui(card.spec.text));
    });
    // Empty labels mean LOAD_UP_TRANSLATIONS has not landed yet.
    const missing = cards.filter(card => !ui(card.spec.header)).map(card => card.spec.header);
    if (missing.length) debug.warn(`missing translations: ${missing.join(", ")}`);
}

// The "/welcome/presets" child: server defaults or a manual customisation run.
export function register() {
    screen = el("div", "presets-content");
    const list = el("div", "presets-list");
    cards = PRESETS.map(buildCard);
    cards.forEach(card => list.appendChild(card.root));
    screen.appendChild(list);
    registerScreen(PATH, screen);
    provide("presets", () => ({
        lastChoice,
        pending: !!choiceTimer,
        cards: cards.map(card => card.spec.name),
        mounted: !!screen.parentNode
    }));
    language.subscribe(render);
    render();
    debug.trace(`registered "${PATH}" with ${cards.length} cards`);
}
