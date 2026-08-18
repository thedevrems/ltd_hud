import { createCheckbox } from "../core/widgets.js";
import { HELPNOTIFY_OPTIONS, optionsOf } from "../core/capabilities.js";
import { config } from "../core/config.js";
import { ui } from "../core/i18n.js";
import {
    createVariantScreen, createAnimationSelect, renderAnimationSelect, optionSetter, mountVariantScreen
} from "../core/variant-screen.js";
import { VARIANTS, updateVariant } from "./helpnotify-variants.js";

const ANIMATIONS = ["fade", "zoom", "from_left", "from_top"];
const DEFAULTS = {
    basic: { use: false, label: "Basique" },
    diamond: { use: false, label: "Losange" },
    hexagon: { use: false, label: "Hexagone" }
};

let checkboxes = {};

function previewData() {
    return {
        header: ui("test_components.help_notify.header"),
        text: ui("test_components.help_notify.text"),
        icon: ui("test_components.help_notify.icon")
    };
}

function buildPreview(selected) {
    const build = VARIANTS[selected];
    return build ? build() : null;
}

function updatePreview(view, slot) {
    updateVariant(view, previewData(), slot.options);
}

function buildOptions(column, parts) {
    checkboxes.shadows = createCheckbox("", optionSetter(parts, "shadows"));
    checkboxes.smoothEdges = createCheckbox("", optionSetter(parts, "smoothEdges"));
    checkboxes.background = createCheckbox("", optionSetter(parts, "background"));
    const animations = createAnimationSelect(parts, ANIMATIONS);
    column.append(checkboxes.shadows.root, checkboxes.smoothEdges.root, checkboxes.background.root, animations.root);
}

function renderOptions(parts, slot) {
    const supported = optionsOf(HELPNOTIFY_OPTIONS, slot.selected);
    checkboxes.shadows.setText(ui("game_menu.options.use_shadows"));
    checkboxes.smoothEdges.setText(ui("game_menu.options.smooth_edges"));
    checkboxes.background.setText(ui("game_menu.options.background"));
    checkboxes.shadows.update(slot.options.shadows, false);
    checkboxes.smoothEdges.update(slot.options.smoothEdges, !slot.options.background);
    checkboxes.background.update(slot.options.background, !supported.background);
    renderAnimationSelect(parts, slot);
}

// The "/menu/helpnotify" child: help notify variant, options and its preview.
export function register() {
    const parts = createVariantScreen({
        id: "settings-helpnotify", path: "/menu/helpnotify", slot: "helpNotify",
        defaults: DEFAULTS, previewScale: "times-2",
        types: () => config.state.HelpNotify.Types,
        buildPreview, updatePreview, buildOptions, renderOptions
    });
    mountVariantScreen(parts);
}
