import { setText } from "./dom.js";
import {
    createSettingsScreen, header, interfaceList, labelFor, animationList, swapPreview, bindScreenRender
} from "./settings-layout.js";
import { createSelection, createSmallSelect } from "./dropdown.js";
import { ENTER_FRAMES, playFrames } from "./animations.js";
import { game, setType, setOption } from "./gamestore.js";
import { config } from "./config.js";
import { language, ui } from "./i18n.js";

// Previews built from translated strings are rebuilt whenever those change.
function renderPreview(parts, slot) {
    const key = slot.selected + "|" + (parts.spec.previewKey ? parts.spec.previewKey() : "");
    if (parts.mounted !== key) {
        parts.mounted = key;
        parts.view = parts.spec.buildPreview(slot.selected);
        swapPreview(parts.screen.preview, parts.view && parts.view.root);
    }
    if (parts.view && parts.spec.updatePreview) parts.spec.updatePreview(parts.view, slot);
}

function render(parts) {
    const slot = game.state[parts.spec.slot];
    const list = interfaceList(parts.spec.defaults, parts.spec.types());
    parts.selection.setHeader(ui("game_menu.options.change_interface"));
    setText(parts.optionsHeader, ui("game_menu.options.options"));
    parts.selection.update(list, slot.selected, labelFor(list, slot.selected));
    renderPreview(parts, slot);
    parts.spec.renderOptions(parts, slot);
}

// Four settings children share this shape: a variant picker, options, a preview.
export function createVariantScreen(spec) {
    const parts = { spec, mounted: null, view: null, optionsHeader: header() };
    parts.screen = createSettingsScreen(spec.id, spec.path, { columns: 2, previewScale: spec.previewScale });
    parts.screen.root.classList.add("hud-content");
    parts.selection = createSelection(value => setType(spec.slot, value));
    parts.screen.columns[0].appendChild(parts.selection.root);
    parts.screen.columns[1].appendChild(parts.optionsHeader);
    parts.render = () => render(parts);
    spec.buildOptions(parts.screen.columns[1], parts);
    return parts;
}

export function optionSetter(parts, key) {
    return value => setOption(parts.spec.slot, key, value);
}

// Switching the animation replays it on the preview, as the build did.
export function createAnimationSelect(parts, names) {
    parts.animations = names;
    parts.animationSelect = createSmallSelect(value => {
        setOption(parts.spec.slot, "animation", value);
        playFrames(ENTER_FRAMES, parts.view && parts.view.root, value);
    });
    return parts.animationSelect;
}

export function renderAnimationSelect(parts, slot) {
    const list = animationList(parts.animations);
    parts.animationSelect.setHeader(ui("game_menu.options.animation"));
    parts.animationSelect.update(list, slot.options.animation, labelFor(list, slot.options.animation));
}

export function mountVariantScreen(parts) {
    bindScreenRender(parts.spec.path, parts.render, [game, config, language]);
}
