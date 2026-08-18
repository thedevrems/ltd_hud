import { setClass, animate } from "../core/dom.js";
import { createCheckbox } from "../core/widgets.js";
import { config } from "../core/config.js";
import { ui } from "../core/i18n.js";
import { game } from "../core/gamestore.js";
import { DURATION } from "../core/animations.js";
import {
    createVariantScreen, createAnimationSelect, renderAnimationSelect, optionSetter, mountVariantScreen
} from "../core/variant-screen.js";
import { VARIANTS } from "./notify-variants.js";

const ANIMATIONS = ["fade", "zoom", "from_left", "from_top", "from_right", "from_bottom"];
const DEFAULTS = {
    basic: { use: false, label: "Basic" },
    modern: { use: false, label: "Modern" },
    default: { use: false, label: "Default" },
    diamond: { use: false, label: "Diamond" }
};

let checkboxes = {};

function previewData() {
    return {
        header: ui("test_components.notification.header"),
        text: ui("test_components.notification.text"),
        icon: ui("test_components.notification.icon")
    };
}

// The preview reuses the live notify markup, progress bar animation included.
function buildPreview(selected) {
    const build = VARIANTS[selected];
    if (!build) return null;
    const root = build(previewData(), game.state.notifies.options);
    root.classList.add("notify-element");
    fillProgress(root);
    return { root };
}

function fillProgress(root) {
    const bar = root.querySelector(".value-progress");
    if (!bar) return;
    const property = bar.style.height ? "height" : "width";
    animate(bar, { [property]: ["0%", "100%"] }, { duration: DURATION, easing: "linear" });
}

function updatePreview(view, slot) {
    setClass(view.root, "smoothEdges", slot.options.smoothEdges);
}

function buildOptions(column, parts) {
    checkboxes["3d-mode"] = createCheckbox("", optionSetter(parts, "3d-mode"));
    checkboxes.list = createCheckbox("", optionSetter(parts, "list"));
    checkboxes.shadows = createCheckbox("", optionSetter(parts, "shadows"));
    checkboxes.smoothEdges = createCheckbox("", optionSetter(parts, "smoothEdges"));
    const animations = createAnimationSelect(parts, ANIMATIONS);
    column.append(checkboxes["3d-mode"].root, checkboxes.list.root, checkboxes.shadows.root,
        checkboxes.smoothEdges.root, animations.root);
}

function renderOptions(parts, slot) {
    checkboxes["3d-mode"].setText(ui("game_menu.options.use_3d"));
    checkboxes.list.setText(ui("game_menu.options.use_list"));
    checkboxes.shadows.setText(ui("game_menu.options.use_shadows"));
    checkboxes.smoothEdges.setText(ui("game_menu.options.smooth_edges"));
    checkboxes["3d-mode"].update(slot.options["3d-mode"], !config.state.UI.Use3DContent);
    checkboxes.list.update(slot.options.list, false);
    checkboxes.shadows.update(slot.options.shadows, false);
    checkboxes.smoothEdges.update(slot.options.smoothEdges, false);
    renderAnimationSelect(parts, slot);
}

// The "/menu/notifications" child: notify variant, options and its preview.
export function register() {
    const parts = createVariantScreen({
        id: "settings-notifications", path: "/menu/notifications", slot: "notifies",
        defaults: DEFAULTS, previewScale: "times-2",
        types: () => config.state.Notify.Types,
        previewKey: () => Object.values(previewData()).join("|"),
        buildPreview, updatePreview, buildOptions, renderOptions
    });
    mountVariantScreen(parts);
}
