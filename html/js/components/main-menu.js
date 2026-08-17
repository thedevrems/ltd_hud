import { el, clear, setText, setHTML, setStyle } from "../core/dom.js";
import { register as registerScreen, subscribe } from "../core/screens.js";
import { config } from "../core/config.js";
import { language, ui } from "../core/i18n.js";
import { player, setSteamName } from "../core/playerstore.js";
import { post } from "../core/nui.js";
import sfx from "../core/sfx.js";
import { playIntro, playOutro, resetIntro } from "./main-menu-intro.js";

const DEFAULT_LINKS = {
    youtube: { label: "YouTube", icon: "fab fa-youtube", url: "https://www.youtube.com/", use: true },
    store: { label: "Store", icon: "fas fa-globe", url: "https://www.mywebsite.com", use: true },
    discord: { label: "Discord", icon: "fab fa-discord", url: "https://discord.gg", use: true }
};

let screen = null;
let redirects = null;
let connected = null;
let isMounted = false;
let isReady = false;

function openLink(url) {
    if (url && typeof window.invokeNative === "function") window.invokeNative("openUrl", url);
}

function buildRedirect(link) {
    const node = el("div", "redirect");
    const icon = el("div", "icon");
    icon.appendChild(el("i", link.icon));
    node.appendChild(icon);
    const text = el("div", "text");
    setText(text, link.label);
    node.appendChild(text);
    setStyle(node, { display: link.use ? "flex" : "none" });
    node.onclick = () => openLink(link.url);
    return node;
}

// The three shortcuts come from the pause menu navbar config.
function renderRedirects() {
    const navbar = (config.state.PauseMenu && config.state.PauseMenu.NavbarElements) || {};
    clear(redirects);
    for (const key in DEFAULT_LINKS) {
        redirects.appendChild(buildRedirect(navbar[key] || DEFAULT_LINKS[key]));
    }
}

function renderConnected() {
    clear(connected);
    const span = el("span");
    setText(span, player.state.steamName);
    connected.appendChild(document.createTextNode(ui("main_menu.connected_in_as") + " "));
    connected.appendChild(span);
}

function renderLogo() {
    const logo = screen.querySelector(".center .logo img");
    const source = config.state.Server.Logo;
    if (logo.src === source) return;
    logo.src = source;
    new Image().src = source;
}

function render() {
    renderConnected();
    renderRedirects();
    renderLogo();
    setHTML(screen.querySelector(".center .text"), ui("main_menu.press_enter"));
}

// Enter is only armed once the intro sequence has fully settled.
function onKeydown(event) {
    if (!isReady || event.code !== "Enter") return;
    isReady = false;
    screen.classList.remove("active");
    sfx.wind.play();
    playOutro(screen, () => post("mainMenu.finished", {}));
}

function onEntered() {
    render();
    isReady = false;
    window.addEventListener("keydown", onKeydown);
    playIntro(screen, () => { isReady = true; });
}

function onLeft() {
    isReady = false;
    window.removeEventListener("keydown", onKeydown);
    resetIntro(screen);
}

function onRouteChanged(to) {
    const inside = to === "/mainmenu";
    if (inside === isMounted) return;
    isMounted = inside;
    if (inside) onEntered();
    else onLeft();
}

// The "/mainmenu" screen: sliding bars, server logo and the press-enter prompt.
export function register(bus) {
    screen = document.getElementById("main-menu-screen");
    redirects = screen.querySelector(".top-nav .redirects");
    connected = screen.querySelector(".top-nav .connected-box");
    bus.on("SET_PLAYER_STEAM_NAME", data => setSteamName(data.name));
    registerScreen("/mainmenu", screen);
    render();
    config.subscribe(render);
    language.subscribe(render);
    player.subscribe(renderConnected);
    subscribe(onRouteChanged);
}
