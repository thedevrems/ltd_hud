import { setText } from "../core/dom.js";
import { createCheckbox, createRange } from "../core/widgets.js";
import { header } from "../core/settings-layout.js";
import { config } from "../core/config.js";
import { ui } from "../core/i18n.js";
import { game, setOption, setRefreshIntervals } from "../core/gamestore.js";
import {
    createVariantScreen, createAnimationSelect, renderAnimationSelect, optionSetter, mountVariantScreen
} from "../core/variant-screen.js";
import { VARIANTS } from "./carhud-variants.js";

const ANIMATIONS = ["fade", "zoom", "from_left", "from_top", "from_right", "from_bottom"];
const STROKE_MINIMUM = 20;
const STROKE_SPAN = 70;
const PREVIEW = { speed: 90, rpm: 80, fuel: 40, gear: 3 };

let shadows = null;
let strokeHeader = null;
let strokeRange = null;
let refreshHeader = null;
let refreshRange = null;

function buildPreview(selected) {
    const build = VARIANTS[selected];
    return build ? build(false) : null;
}

// The dial reads fixed demo values; only the stroke and metrics stay live.
function updatePreview(view, slot) {
    view.apply(Object.assign({}, PREVIEW, {
        metrics: config.state.Metrics,
        strokeWidth: slot.options.strokeWidth
    }));
}

function onStrokeChange(percent) {
    setOption("carhud", "strokeWidth", percent / 100 * STROKE_SPAN + STROKE_MINIMUM);
}

function onRefreshChange(percent) {
    const interval = game.state.carhud.refreshInterval;
    setRefreshIntervals("carhud", percent / 100 * (interval.max - interval.min) + interval.min);
}

function buildOptions(column, parts) {
    shadows = createCheckbox("", optionSetter(parts, "shadows"));
    const animations = createAnimationSelect(parts, ANIMATIONS);
    strokeHeader = header();
    strokeRange = createRange(onStrokeChange);
    refreshHeader = header({ "margin-top": "auto" });
    refreshRange = createRange(onRefreshChange);
    column.append(shadows.root, animations.root, strokeHeader, strokeRange.root,
        refreshHeader, refreshRange.root);
}

function renderOptions(parts, slot) {
    shadows.setText(ui("game_menu.options.use_shadows"));
    shadows.update(slot.options.shadows, false);
    setText(strokeHeader, ui("game_menu.options.stroke_width"));
    setText(refreshHeader, ui("game_menu.options.refresh_intervals"));
    strokeRange.setTexts(ui("game_menu.options.thin"), ui("game_menu.options.thick"));
    refreshRange.setTexts(ui("game_menu.options.quality"), ui("game_menu.options.performance"));
    strokeRange.setDisabled(slot.selected === "default");
    strokeRange.setValue((slot.options.strokeWidth - STROKE_MINIMUM) / STROKE_SPAN * 100);
    const interval = slot.refreshInterval;
    refreshRange.setValue((interval.current - interval.min) / (interval.max - interval.min) * 100);
    renderAnimationSelect(parts, slot);
}

// The "/menu/carhud" child: dial variant, options and its live preview.
export function register() {
    const parts = createVariantScreen({
        id: "settings-carhud", path: "/menu/carhud", slot: "carhud",
        defaults: { basic: { use: false, label: "Basic" }, default: { use: false, label: "Default" } },
        types: () => config.state.CarHud.Types,
        buildPreview, updatePreview, buildOptions, renderOptions
    });
    mountVariantScreen(parts);
}
