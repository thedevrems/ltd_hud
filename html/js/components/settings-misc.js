import { el, setText, setImageSource } from "../core/dom.js";
import { createSettingsScreen, header, labelFor, bindScreenRender } from "../core/settings-layout.js";
import { createSmallSelect } from "../core/dropdown.js";
import { createCheckbox, createRange } from "../core/widgets.js";
import { config } from "../core/config.js";
import { language, ui } from "../core/i18n.js";
import { game, setOption } from "../core/gamestore.js";
import { music, changeMusic, changeVolume } from "../core/musicstore.js";
import { createMusicBlock, createTextInput } from "./settings-misc-widgets.js";

const CHAT_SIZES = ["small", "medium", "big"];
const MUSIC_PLACEHOLDER = "YouTube URL";
const MUSIC_SAVED = "SAVED";

let screen = null;
let logo = null;
let musicBlock = null;
let musicInput = null;
let musicRange = null;
let musicHeader = null;
let chatHeader = null;
let chatSize = null;
let minimapHeader = null;
let checkboxes = {};

function optionSetter(key) {
    return value => setOption("misc", key, value);
}

function chatSizeList() {
    const list = {};
    CHAT_SIZES.forEach(name => { list[name] = { name, label: ui("game_menu.chat_sizes." + name) }; });
    return list;
}

function buildMusicBlock(column) {
    musicHeader = header();
    musicBlock = createMusicBlock();
    musicInput = createTextInput(url => changeMusic(url));
    musicRange = createRange(value => changeVolume(value));
    column.append(musicHeader, musicBlock.root, musicInput.root, musicRange.root);
}

function buildChatBlock(column) {
    chatHeader = header({ "margin-top": "1vw", "margin-bottom": ".5vw" });
    chatSize = createSmallSelect(value => setOption("misc", "chat_size", value));
    column.append(chatHeader, chatSize.root);
}

function buildMinimapBlock(column) {
    minimapHeader = header();
    checkboxes.use_minimap_overlay = createCheckbox("", optionSetter("use_minimap_overlay"));
    checkboxes.minimap_outline = createCheckbox("", optionSetter("minimap_outline"));
    checkboxes.minimap_innershadow = createCheckbox("", optionSetter("minimap_innershadow"));
    column.append(minimapHeader, checkboxes.use_minimap_overlay.root,
        checkboxes.minimap_outline.root, checkboxes.minimap_innershadow.root);
}

function show(node, visible) {
    node.style.display = visible ? "" : "none";
}

function renderMusic() {
    const useMusic = !!config.state.UI.UseMusic;
    [musicHeader, musicBlock.root, musicInput.root, musicRange.root].forEach(node => show(node, useMusic));
    show(screen.dividers[0], useMusic);
    if (!useMusic) return;
    setText(musicHeader, ui("game_menu.options.music"));
    musicInput.setTexts(MUSIC_PLACEHOLDER, MUSIC_SAVED);
    musicRange.setTexts(ui("game_menu.options.quiet"), ui("game_menu.options.loud"));
    musicRange.setValue(music.state.volume);
    musicBlock.update(music.state.data);
}

function renderChat() {
    const allowed = !!(config.state.Chat && config.state.Chat.AllowUserChangeSize);
    [chatHeader, chatSize.root].forEach(node => show(node, allowed));
    if (!allowed) return;
    const list = chatSizeList();
    const selected = game.state.misc.options.chat_size;
    setText(chatHeader, ui("game_menu.options.chat"));
    chatSize.setHeader(ui("game_menu.options.chat_size"));
    chatSize.update(list, selected, labelFor(list, selected));
}

function renderMinimap() {
    const options = game.state.misc.options;
    setText(minimapHeader, ui("game_menu.options.minimap"));
    checkboxes.use_minimap_overlay.setText(ui("game_menu.options.use_minimap_overlay"));
    checkboxes.minimap_outline.setText(ui("game_menu.options.use_minimap_outline"));
    checkboxes.minimap_innershadow.setText(ui("game_menu.options.use_minimap_innershadow"));
    checkboxes.use_minimap_overlay.update(options.use_minimap_overlay, false);
    checkboxes.minimap_outline.update(options.minimap_outline, !options.use_minimap_overlay);
    checkboxes.minimap_innershadow.update(options.minimap_innershadow, !options.use_minimap_overlay);
}

function render() {
    renderMusic();
    renderChat();
    renderMinimap();
    setImageSource(logo, config.state.Server.Logo);
}

// The "/menu/misc" child: music, chat size and the minimap overlay options.
export function register() {
    screen = createSettingsScreen("settings-misc", "/menu/misc", { columns: 2 });
    screen.root.classList.add("hud-content");
    buildMusicBlock(screen.columns[0]);
    buildChatBlock(screen.columns[0]);
    buildMinimapBlock(screen.columns[1]);
    logo = el("img");
    screen.preview.appendChild(logo);
    bindScreenRender("/menu/misc", render, [game, config, language, music]);
}
