import { setText } from "../core/dom.js";
import {
    createSettingsScreen, header, interfaceList, labelFor, swapPreview, bindScreenRender
} from "../core/settings-layout.js";
import { createSelection } from "../core/dropdown.js";
import { createCheckbox, createRange, createComponentVisibility } from "../core/widgets.js";
import { HUD_OPTIONS, optionsOf } from "../core/capabilities.js";
import { config } from "../core/config.js";
import { language, ui } from "../core/i18n.js";
import { game, setType, setOption, setRefreshIntervals, setMiniComponentVisibility } from "../core/gamestore.js";
import { VARIANTS, updateVariant } from "./hud-variants.js";

const PREVIEW_ICON = "fas fa-heart";
const PREVIEW_ICON_SIZE = "3vw";
const PREVIEW_VALUE = { basic: 100, skew: 100 };
const DEFAULTS = {
    basic: { use: false, label: "Basic" },
    skew: { use: false, label: "Skew" },
    circle: { use: false, label: "Circle" },
    diamond: { use: false, label: "Diamond" },
    modern: { use: false, label: "Modern" },
    hexagon: { use: true, label: "Hexagon" },
    square: { use: true, label: "Square" }
};

let screen = null;
let selection = null;
let visibility = null;
let checkboxes = {};
let refreshHeader = null;
let refreshRange = null;
let optionsHeader = null;
let mounted = null;
let mountedView = null;

function onOptionUpdate(key) {
    return value => setOption("hud", key, value);
}

// The slider maps 0-100 onto the interval bounds the component declares.
function onRefreshChange(percent) {
    const interval = game.state.hud.refreshInterval;
    setRefreshIntervals("hud", percent / 100 * (interval.max - interval.min) + interval.min);
}

function onVisibilityUpdate(name, state) {
    setMiniComponentVisibility("hud", name, state);
}

function buildOptionsColumn(column) {
    optionsHeader = header();
    checkboxes["3d-mode"] = createCheckbox("", onOptionUpdate("3d-mode"));
    checkboxes.shadows = createCheckbox("", onOptionUpdate("shadows"));
    checkboxes.smoothEdges = createCheckbox("", onOptionUpdate("smoothEdges"));
    refreshHeader = header({ "margin-top": "auto" });
    refreshRange = createRange(onRefreshChange);
    column.append(optionsHeader, checkboxes["3d-mode"].root, checkboxes.shadows.root,
        checkboxes.smoothEdges.root, refreshHeader, refreshRange.root);
}

function statusData() {
    const list = {};
    Object.values(config.state.Hud.Status).forEach(status => {
        list[status.name] = { name: status.name, icon: status.icon, isVisible: game.state.hud.visibility[status.name] };
    });
    return list;
}

function renderTexts() {
    selection.setHeader(ui("game_menu.options.change_interface"));
    visibility.setHeader(ui("game_menu.options.components_visibility"));
    setText(optionsHeader, ui("game_menu.options.options"));
    setText(refreshHeader, ui("game_menu.options.refresh_intervals"));
    checkboxes["3d-mode"].setText(ui("game_menu.options.use_3d"));
    checkboxes.shadows.setText(ui("game_menu.options.use_shadows"));
    checkboxes.smoothEdges.setText(ui("game_menu.options.smooth_edges"));
    refreshRange.setTexts(ui("game_menu.options.quality"), ui("game_menu.options.performance"));
}

function renderOptions() {
    const slot = game.state.hud;
    const supported = optionsOf(HUD_OPTIONS, slot.selected);
    checkboxes["3d-mode"].update(slot.options["3d-mode"], config.state.UI.Use3DContent ? !supported["3d-mode"] : true);
    checkboxes.shadows.update(slot.options.shadows, !supported.shadows);
    checkboxes.smoothEdges.update(slot.options.smoothEdges, !supported.smoothEdges);
    const interval = slot.refreshInterval;
    refreshRange.setValue((interval.current - interval.min) / (interval.max - interval.min) * 100);
}

// The preview shows one heart status, sized up and outside the in-game scale.
function renderPreview() {
    const slot = game.state.hud;
    if (mounted !== slot.selected) mountPreview(slot.selected);
    if (!mountedView) return;
    updateVariant(mountedView, PREVIEW_VALUE[slot.selected] || 60, game.state.color.primaryColor, slot.options, false);
}

function mountPreview(selected) {
    mounted = selected;
    const build = VARIANTS[selected];
    mountedView = build ? build(PREVIEW_ICON, PREVIEW_ICON_SIZE) : null;
    swapPreview(screen.preview, mountedView && mountedView.root);
}

function render() {
    const list = interfaceList(DEFAULTS, config.state.Hud.Types);
    renderTexts();
    selection.update(list, game.state.hud.selected, labelFor(list, game.state.hud.selected));
    visibility.update(statusData());
    renderOptions();
    renderPreview();
}

// The "/menu/hud" child: variant picker, status toggles and hud options.
export function register() {
    screen = createSettingsScreen("settings-hud", "/menu/hud", { columns: 2 });
    screen.root.classList.add("hud-content");
    selection = createSelection(value => setType("hud", value));
    visibility = createComponentVisibility(onVisibilityUpdate);
    screen.columns[0].append(selection.root, visibility.root);
    buildOptionsColumn(screen.columns[1]);
    bindScreenRender("/menu/hud", render, [game, config, language]);
}
