import { el, animate } from "../core/dom.js";
import {
    createSelectBox, createWelcomeCheckbox, createWelcomeRange, createWelcomeColorPicker
} from "../core/welcome-widgets.js";
import { PREVIEWS, previewBox } from "./welcome-previews.js";
import { HUD_OPTIONS, HELPNOTIFY_OPTIONS, optionsOf } from "../core/capabilities.js";
import { config } from "../core/config.js";
import { ui } from "../core/i18n.js";
import { game, setType, setOption, setColor } from "../core/gamestore.js";
import { setPrimaryColor } from "../core/theme.js";
import sfx from "../core/sfx.js";

const EASING = "cubic-bezier(0.075, 0.82, 0.165, 1)";
const ENTER_DURATION = 1000;
const LEAVE_DURATION = 750;
const STROKE_MINIMUM = 20;
const STROKE_SPAN = 70;
const SELECT_HEADER = "Type";
const SLOTS = { hud: "hud", carhud: "carhud", notifications: "notifies", helpNotify: "helpNotify", progressBar: "progressBar" };
const TYPES = { hud: "Hud", carhud: "CarHud", notifications: "Notify", helpNotify: "HelpNotify", progressBar: "ProgressBar" };
const CAPABILITIES = { hud: HUD_OPTIONS, helpNotify: HELPNOTIFY_OPTIONS };
const CHECKBOXES = {
    hud: [["3d-mode", "use_3d"], ["smoothEdges", "smooth_edges"], ["shadows", "use_shadows"]],
    carhud: [["shadows", "use_shadows"]],
    notifications: [["3d-mode", "use_3d"], ["list", "use_list"], ["smoothEdges", "smooth_edges"]],
    helpNotify: [["shadows", "use_shadows"], ["background", "background"], ["smoothEdges", "smooth_edges"]],
    progressBar: [["shadows", "use_shadows"]]
};

function slotOf(element) {
    return game.state[SLOTS[element]];
}

function typeList(element) {
    return config.state[TYPES[element]].Types;
}

function onStrokeChange(percent) {
    setOption("carhud", "strokeWidth", percent / 100 * STROKE_SPAN + STROKE_MINIMUM);
}

function buildOptions(parts) {
    const column = el("div", "settings-content");
    if (parts.element === "carhud") {
        parts.stroke = createWelcomeRange(onStrokeChange);
        column.appendChild(parts.stroke.root);
    }
    (CHECKBOXES[parts.element] || []).forEach(([key, label]) => {
        const box = createWelcomeCheckbox(value => setOption(SLOTS[parts.element], key, value));
        parts.checkboxes.push({ key, label, box });
        column.appendChild(box.root);
    });
    return column;
}

function buildSelection(parts) {
    const column = el("div", "selection");
    if (parts.element === "theme") return column;
    parts.select = createSelectBox(value => {
        sfx.click.play();
        setType(SLOTS[parts.element], value);
    });
    parts.select.setHeader(SELECT_HEADER);
    column.appendChild(parts.select.root);
    return column;
}

// The theme step swaps the variant preview for the primary colour swatch.
function buildPicker(parts, host) {
    const box = el("div", "input-box");
    // L'aperçu écrit la primaire ET ses dérivées : le bandeau du joueur colore son
    // filet et son identifiant avec l'accent, qui en découle.
    parts.picker = createWelcomeColorPicker(
        value => setPrimaryColor(value),
        value => setColor("primaryColor", value)
    );
    box.appendChild(parts.picker.root);
    host.appendChild(box);
}

// Variants slide out to the right while the new one slides in from the left.
function swapPreview(parts, box) {
    const previous = parts.box;
    if (previous) {
        const leave = animate(previous, { left: ["0vw", "20vw"], opacity: [1, 0] },
            { duration: LEAVE_DURATION, easing: EASING });
        if (leave) leave.onfinish = () => previous.remove();
        else previous.remove();
    }
    parts.box = box;
    if (!box) return;
    parts.host.appendChild(box);
    animate(box, { left: ["-10vw", "0vw"], opacity: [0, 1] }, { duration: ENTER_DURATION, easing: EASING });
}

function renderPreview(parts, slot) {
    const spec = PREVIEWS[parts.element];
    if (parts.mounted !== slot.selected) {
        parts.mounted = slot.selected;
        parts.view = spec.build(slot.selected);
        const box = previewBox(parts.element, slot.selected);
        if (parts.view) box.appendChild(parts.view.root);
        swapPreview(parts, box);
    }
    if (parts.view && spec.update) spec.update(parts.view, slot);
}

function renderCheckboxes(parts, slot) {
    const table = CAPABILITIES[parts.element];
    const supported = table ? optionsOf(table, slot.selected) : null;
    parts.checkboxes.forEach(entry => {
        entry.box.setLabel(ui("game_menu.options." + entry.label));
        entry.box.update(slot.options[entry.key], supported ? !supported[entry.key] : false);
    });
}

function renderStroke(parts, slot) {
    if (!parts.stroke) return;
    parts.stroke.setHeader(ui("game_menu.options.stroke_width"));
    parts.stroke.update((slot.options.strokeWidth - STROKE_MINIMUM) / STROKE_SPAN * 100, slot.selected === "default");
}

function render(parts) {
    if (parts.element === "theme") return parts.picker.update(game.state.color.primaryColor);
    const slot = slotOf(parts.element);
    const list = typeList(parts.element);
    parts.select.update(list, list[slot.selected] ? list[slot.selected].label : slot.selected);
    renderPreview(parts, slot);
    renderCheckboxes(parts, slot);
    renderStroke(parts, slot);
}

// The middle block of every customisation step: picker, live preview, options.
export function createCustomization(element) {
    const parts = { element, checkboxes: [], mounted: null, view: null, box: null };
    const root = el("div", "customization-content");
    parts.host = el("div", "selected-ui");
    parts.host.appendChild(el("div", "hitbox-info"));
    if (element === "theme") buildPicker(parts, parts.host);
    root.append(buildSelection(parts), parts.host, buildOptions(parts));
    return { root, render: () => render(parts) };
}
