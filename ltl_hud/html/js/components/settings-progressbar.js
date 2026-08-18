import { el } from "../core/dom.js";
import { createCheckbox } from "../core/widgets.js";
import { config } from "../core/config.js";
import { ui } from "../core/i18n.js";
import {
    createVariantScreen, createAnimationSelect, renderAnimationSelect, optionSetter, mountVariantScreen
} from "../core/variant-screen.js";
import { VARIANTS } from "./progressbar-variants.js";

const ANIMATIONS = ["fade", "zoom", "from_left", "from_top", "from_right", "from_bottom"];
const PREVIEW_ICON = "fas fa-heart";
const DEFAULTS = {
    basic: { use: false, label: "Basique" },
    modern: { use: false, label: "Moderne" },
    diamond: { use: false, label: "Losange" }
};

let shadows = null;

// The bar sits in its own wrapper so the animation replays on the whole block.
function buildPreview(selected) {
    const build = VARIANTS[selected];
    if (!build) return null;
    const root = el("div", "progress-bar-element");
    const bar = build({ icon: PREVIEW_ICON, text: ui("test_components.progress_bar.text") });
    bar.root.classList.add("isGameMenu");
    root.appendChild(bar.root);
    return { root };
}

function buildOptions(column, parts) {
    shadows = createCheckbox("", optionSetter(parts, "shadows"));
    const animations = createAnimationSelect(parts, ANIMATIONS);
    column.append(shadows.root, animations.root);
}

function renderOptions(parts, slot) {
    shadows.setText(ui("game_menu.options.use_shadows"));
    shadows.update(slot.options.shadows, false);
    renderAnimationSelect(parts, slot);
}

// The "/menu/progressbar" child: bar variant, options and its preview.
export function register() {
    const parts = createVariantScreen({
        id: "settings-progressbar", path: "/menu/progressbar", slot: "progressBar",
        defaults: DEFAULTS, previewScale: "times-175",
        types: () => config.state.ProgressBar.Types,
        previewKey: () => ui("test_components.progress_bar.text"),
        buildPreview, buildOptions, renderOptions
    });
    mountVariantScreen(parts);
}
