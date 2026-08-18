import { el, clear, setText } from "../core/dom.js";
import { createSettingsScreen, header, spacer, bindScreenRender } from "../core/settings-layout.js";
import { createColorPicker } from "../core/color.js";
import { createRange, createCheckbox } from "../core/widgets.js";
import { convertHexToRGBA } from "../core/format.js";
import { config } from "../core/config.js";
import { language, ui } from "../core/i18n.js";
import { game, setColor, setComponentColor } from "../core/gamestore.js";

const ROOT_VARIABLE = {
    primaryColor: "--primary-color",
    primaryBackground: "--primary-background",
    primaryBackgroundOpacity: "--primary-background",
    backgroundColor: "--default-background-game-menu",
    backgroundColorOpacity: "--default-background-game-menu"
};
const OPACITY_PARENT = { backgroundColorOpacity: "backgroundColor", primaryBackgroundOpacity: "primaryBackground" };

let screen = null;
let headers = {};
let pickers = {};
let ranges = {};
let statusRow = null;
let statusPickers = [];
let useCustomColors = null;

function setRootVariable(name, value) {
    document.documentElement.style.setProperty(name, value);
}

// Saving a colour also refreshes the CSS variable that renders it live.
function saveUIColor(key) {
    return value => {
        setColor(key, value);
        const opacity = game.state.color[key + "Opacity"];
        setRootVariable(ROOT_VARIABLE[key], opacity ? convertHexToRGBA(game.state.color[key], opacity) : value);
    };
}

// The slider maps 0-100 onto the opacity range the component allows.
function onOpacityChange(key, minimum) {
    return percent => {
        setColor(key, percent / 100 * (1 - minimum) + minimum);
        const parent = game.state.color[OPACITY_PARENT[key]];
        setRootVariable(ROOT_VARIABLE[key], convertHexToRGBA(parent, game.state.color[key]));
    };
}

function buildPicker(key) {
    return createColorPicker({ full: true, text: "", onChange: saveUIColor(key), onClose: saveUIColor(key) });
}

function buildOpacityRange(key, minimum) {
    return createRange(onOpacityChange(key, minimum));
}

function buildMenuColumn(column) {
    headers.menuColors = header();
    headers.backgroundOpacity = header({ "margin-top": ".5vw" });
    headers.interfaceColor = header({ "margin-top": "1vw" });
    headers.interfaceOpacity = header({ "margin-top": ".5vw" });
    pickers.primaryColor = buildPicker("primaryColor");
    pickers.backgroundColor = buildPicker("backgroundColor");
    pickers.primaryBackground = buildPicker("primaryBackground");
    pickers.backgroundColor.root.style.opacity = ".8";
    pickers.primaryBackground.root.style.opacity = ".8";
    ranges.backgroundColorOpacity = buildOpacityRange("backgroundColorOpacity", .25);
    ranges.primaryBackgroundOpacity = buildOpacityRange("primaryBackgroundOpacity", 0);
    column.append(headers.menuColors, pickers.primaryColor.root, pickers.backgroundColor.root,
        headers.backgroundOpacity, ranges.backgroundColorOpacity.root, spacer("1vw"),
        headers.interfaceColor, pickers.primaryBackground.root,
        headers.interfaceOpacity, ranges.primaryBackgroundOpacity.root, spacer("1vw"));
}

function buildStatusColumn(column) {
    headers.statusColors = header();
    useCustomColors = createCheckbox("", value => setColor("useCustomHudColors", value));
    statusRow = el("div", "row");
    column.append(headers.statusColors, useCustomColors.root, statusRow);
}

function renderStatusPickers() {
    const statuses = Object.values(config.state.Hud.Status);
    const names = statuses.map(status => status.name).join("|");
    if (statusRow.dataset.names !== names) buildStatusPickers(statuses, names);
    const custom = game.state.color.useCustomHudColors;
    statusPickers.forEach(entry => {
        entry.picker.update(custom ? game.state.color.hud[entry.name] : game.state.color.primaryColor, !custom);
    });
}

function buildStatusPickers(statuses, names) {
    statusRow.dataset.names = names;
    clear(statusRow);
    statusPickers = statuses.map(status => {
        const save = value => setComponentColor("hud", status.name, value);
        const picker = createColorPicker({ icon: status.icon, onChange: save, onClose: save });
        statusRow.appendChild(picker.root);
        return { name: status.name, picker };
    });
}

function renderTexts() {
    setText(headers.menuColors, ui("game_menu.options.menu_colors"));
    setText(headers.backgroundOpacity, ui("game_menu.options.background_color_opacity"));
    setText(headers.interfaceColor, ui("game_menu.options.interface_color"));
    setText(headers.interfaceOpacity, ui("game_menu.options.interface_color_opacity"));
    setText(headers.statusColors, ui("game_menu.options.hud_status_colors"));
    useCustomColors.setText(ui("game_menu.options.use_status_colors"));
    const minimal = ui("game_menu.options.transparent");
    const maximal = ui("game_menu.options.full");
    ranges.backgroundColorOpacity.setTexts(minimal, maximal);
    ranges.primaryBackgroundOpacity.setTexts(minimal, maximal);
}

function renderPickerLabels() {
    const colour = config.state.UI.Color || {};
    const background = ui("game_menu.options.background_color");
    pickers.primaryColor.setLabel(ui("game_menu.options.primary_color"));
    pickers.backgroundColor.setLabel(background);
    pickers.primaryBackground.setLabel(background);
    pickers.primaryColor.update(game.state.color.primaryColor, !colour.AllowPrimaryColorChange);
    pickers.backgroundColor.update(game.state.color.backgroundColor, !colour.AllowBackgroundColorChange);
    pickers.primaryBackground.update(game.state.color.primaryBackground, !colour.AllowInterfaceBackgroundColorChange);
}

function renderRanges() {
    const background = game.state.color.backgroundColorOpacity || .25;
    ranges.backgroundColorOpacity.setValue((background - .25) / (1 - .25) * 100);
    ranges.primaryBackgroundOpacity.setValue((game.state.color.primaryBackgroundOpacity || .5) * 100);
}

function render() {
    renderTexts();
    renderPickerLabels();
    renderRanges();
    useCustomColors.update(game.state.color.useCustomHudColors, false);
    renderStatusPickers();
}

// The "/menu/color" child: interface palette plus the per-status hud colours.
export function register() {
    screen = createSettingsScreen("settings-color", "/menu/color", { columns: 2, preview: false });
    buildMenuColumn(screen.columns[0]);
    buildStatusColumn(screen.columns[1]);
    bindScreenRender("/menu/color", render, [game, config, language]);
}
