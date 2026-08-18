import { el, clear, setText, setStyle, setImageSource, animate } from "../core/dom.js";
import { register as registerScreen, push, subscribe } from "../core/screens.js";
import { config, settingsPath } from "../core/config.js";
import { language, ui } from "../core/i18n.js";
import { pauseMenu, setData, setNavs } from "../core/pausemenustore.js";
import { fade } from "../core/musicstore.js";
import { post } from "../core/nui.js";
import { renderUser, renderServerNavs } from "./pause-menu-user.js";

const EASING = "cubic-bezier(0.075, 0.82, 0.165, 1)";
const SLIDE_DURATION = 500;
const MUSIC_FADE_DURATION = 1000;
const GLYPH_PREFIXES = ["fa", "ph"];

let screen = null;
let slide = null;
let avatar = null;
let column = null;
let serverNavs = null;
let logo = null;
let navInfo = null;
let navbar = null;
let quit = null;
let navbarKeys = [];
let renderedKeys = [];
let selectedIndex = 0;
let isMounted = false;
let isDisconnecting = false;
let animations = [];

// Font Awesome and Phosphor names become glyphs, anything else stays plain text.
function appendIcon(node, icon) {
    if (GLYPH_PREFIXES.some(prefix => icon.startsWith(prefix))) return node.appendChild(el("i", icon));
    setText(node, icon);
}

function buildNavItem(key, index) {
    const node = el("div", "nav-item");
    appendIcon(node, pauseMenu.state.navbar[key].icon);
    node.onclick = () => handleNav(pauseMenu.state.navbar[key].path);
    node.onmouseover = () => selectIndex(index);
    node.onkeydown = onNavKeydown;
    return node;
}

// Rebuilt only when the button list itself changes, so focus survives updates.
function renderNavbar() {
    if (!sameKeys(renderedKeys, navbarKeys)) rebuildNavbar();
    applySelection();
}

function sameKeys(left, right) {
    return left.length === right.length && left.every((key, index) => key === right[index]);
}

function rebuildNavbar() {
    renderedKeys = navbarKeys.slice();
    clear(navbar);
    navbarKeys.forEach((key, index) => navbar.appendChild(buildNavItem(key, index)));
    navbar.appendChild(quit);
}

// Only the selected item is tabbable, which is what keeps the keyboard on it.
function applySelection() {
    navbar.querySelectorAll(".nav-item").forEach((node, index) => {
        node.tabIndex = index === selectedIndex ? 0 : -1;
        node.setAttribute("aria-selected", String(index === selectedIndex));
    });
    const entry = pauseMenu.state.navbar[navbarKeys[selectedIndex || 0]];
    setText(navInfo, entry ? entry.label : "");
}

function focusCurrent() {
    const items = navbar.querySelectorAll(".nav-item");
    if (items[selectedIndex]) items[selectedIndex].focus();
}

function selectIndex(index) {
    selectedIndex = index;
    applySelection();
    focusCurrent();
}

function onNavKeydown(event) {
    const last = navbarKeys.length;
    if (event.key === "ArrowRight") return selectIndex((selectedIndex + 1) % last);
    if (event.key === "ArrowLeft") return selectIndex((selectedIndex - 1 + last) % last);
    if (event.key === "Enter") handleNav(pauseMenu.state.navbar[navbarKeys[selectedIndex]].path);
}

// The UI settings entry stays in the frame; everything else goes back to Lua.
function handleNav(path) {
    if (path.type === "UISettings") return push(settingsPath());
    post("pausemenu.handleNav", { path });
}

function render() {
    renderUser(avatar, column);
    renderServerNavs(serverNavs);
    setImageSource(logo, config.state.Server.Logo);
    setText(quit, ui("pause_menu.disconnect"));
    renderNavbar();
}

function track(animation, onDone) {
    if (!animation) return onDone();
    animations.push(animation);
    animation.onfinish = onDone;
}

// The black slide wipes the screen, then the logo shrinks out before quitting.
function handleDisconnect() {
    if (isDisconnecting) return;
    isDisconnecting = true;
    setStyle(screen, { "pointer-events": "none" });
    if (config.state.UI.UseMusic) fade(0, MUSIC_FADE_DURATION);
    setStyle(slide, { display: "flex" });
    const frames = [{ left: "100%" }, { left: "0%" }];
    track(animate(slide, frames, { duration: SLIDE_DURATION, easing: EASING }), shrinkLogo);
}

function shrinkLogo() {
    const frames = [{ transform: "scale(1)", opacity: 1 }, { transform: "scale(0.3)", opacity: 0 }];
    track(animate(logo, frames, { duration: SLIDE_DURATION, easing: EASING }), () => post("pausemenu.disconnect", {}));
}

function resetDisconnect() {
    animations.forEach(animation => animation.cancel());
    animations = [];
    isDisconnecting = false;
    setStyle(screen, { "pointer-events": "all" });
    setStyle(slide, { display: "", left: "" });
    setStyle(logo, { transform: "", opacity: "" });
}

function onEntered() {
    navbarKeys = Object.keys(pauseMenu.state.navbar);
    selectedIndex = 0;
    render();
    setTimeout(focusCurrent, 0);
    post("pausemenu.handleCamera", { state: true });
}

// Leaving for the settings shell forces the camera down instead of releasing it.
function onLeft(to) {
    post("pausemenu.handleCamera", { state: false, force: to.startsWith("/menu") });
    resetDisconnect();
}

function onRouteChanged(to) {
    const inside = to === "/pausemenu";
    if (inside === isMounted) return;
    isMounted = inside;
    if (inside) onEntered();
    else onLeft(to);
}

// The "/pausemenu" screen: identity panel, server links and the navbar.
export function register(bus) {
    screen = document.getElementById("pause-menu-screen");
    slide = screen.querySelector(".screen-slide");
    avatar = screen.querySelector(".user-data .avatar");
    column = screen.querySelector(".user-data .column");
    serverNavs = screen.querySelector(".server-navs");
    logo = screen.querySelector(".logo-part img");
    navInfo = screen.querySelector(".nav-info");
    navbar = screen.querySelector(".navbar");
    quit = screen.querySelector(".quit-game");
    quit.onclick = handleDisconnect;
    bus.on("UPDATE_PAUSEMENU", data => setData(data.userData));
    bus.on("SEND_PAUSEMENU_DATA_BUTTONS", data => setNavs(data));
    registerScreen("/pausemenu", screen);
    resetDisconnect();
    render();
    config.subscribe(render);
    language.subscribe(render);
    pauseMenu.subscribe(render);
    subscribe(onRouteChanged);
}
