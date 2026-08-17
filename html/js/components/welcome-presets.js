import { el, svgEl, setText } from "../core/dom.js";
import { register as registerScreen, push } from "../core/screens.js";
import { post } from "../core/nui.js";
import { writeJSON } from "../core/storage.js";
import { language, ui } from "../core/i18n.js";
import sfx from "../core/sfx.js";

const PATH = "/welcome/presets";
const CHOICE_DELAY = 5000;
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
function applyServerPreset() {
    sfx.enter_welcome.play();
    push("/");
    post("storage.setCreatedUI", {});
    writeJSON("UIConfigured", true);
}

function onChoice(name) {
    sfx.plum.play();
    push("/welcome");
    setTimeout(() => {
        if (name === "server_preset") return applyServerPreset();
        push("/welcome/customize");
    }, CHOICE_DELAY);
}

function render() {
    cards.forEach(card => {
        if (card.badge) setText(card.badge, ui("presets.recommended"));
        setText(card.header, ui(card.spec.header));
        setText(card.text, ui(card.spec.text));
    });
}

// The "/welcome/presets" child: server defaults or a manual customisation run.
export function register() {
    screen = el("div", "presets-content");
    const list = el("div", "presets-list");
    cards = PRESETS.map(buildCard);
    cards.forEach(card => list.appendChild(card.root));
    screen.appendChild(list);
    registerScreen(PATH, screen);
    language.subscribe(render);
    render();
}
