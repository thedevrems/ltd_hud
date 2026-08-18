import { el, clear, setText, setClass } from "../core/dom.js";
import { config } from "../core/config.js";
import { player, setData } from "../core/playerstore.js";
import { formatCurrency } from "../core/format.js";
import { countTo } from "../core/counter.js";

const ID_LENGTH = 5;

let host = null;
let topRow = null;
let idBox = null;
let idDigits = null;
let walletRow = null;
let addonRow = null;
const walletValues = {};

function visible() {
    return (config.state.Displayer && config.state.Displayer.Visible) || {};
}

function build() {
    topRow = el("div", "row");
    idBox = el("div", "element id");
    idDigits = el("div", "text bold");
    const hash = el("div", "icon");
    hash.textContent = "#";
    idBox.append(hash, idDigits);
    walletRow = el("div", "row");
    addonRow = el("div", "row");
    host.append(topRow, walletRow, addonRow);
}

// Leading zeroes of the padded id are dimmed, the significant digits are not.
function renderId() {
    const padded = String(player.state.user.id).padStart(ID_LENGTH, "0");
    const lead = padded.length - padded.replace(/^0+/, "").length;
    clear(idDigits);
    padded.split("").forEach((digit, index) => {
        const cell = el("div", index < lead ? "zero" : "non-zero");
        cell.textContent = digit;
        idDigits.appendChild(cell);
    });
}

function makeElement(text, icon) {
    const element = el("div", "element");
    const label = el("div", "text");
    label.style.marginRight = ".25vw";
    setText(label, text);
    const iconBox = el("div", "icon");
    iconBox.appendChild(el("i", icon));
    element.append(label, iconBox);
    return element;
}

function renderJobs() {
    clear(topRow);
    if (visible().id) topRow.appendChild(idBox);
    if (!visible().jobs) return;
    const base = player.state.user.base || {};
    for (const key in base) topRow.appendChild(makeElement(base[key].text, base[key].icon));
}

function renderWallets() {
    clear(walletRow);
    if (!visible().wallets) return;
    const wallets = player.state.user.wallets || {};
    for (const key in wallets) {
        const amount = walletValues[key] === undefined ? wallets[key].text : walletValues[key];
        walletRow.appendChild(makeElement(currency(amount), wallets[key].icon));
    }
}

function renderAddon() {
    const addon = player.state.user.addon;
    addonRow.style.display = addon ? "" : "none";
    clear(addonRow);
    if (!addon || !visible().addon) return;
    for (const key in addon) addonRow.appendChild(makeElement(addon[key].text, addon[key].icon));
}

function currency(value) {
    return formatCurrency(value, config.state.Currency, {
        removeDecimals: !!config.state.UI.RemoveDecimalsFromWallets
    });
}

function render() {
    host.style.display = config.state.Displayer && config.state.Displayer.Use ? "flex" : "none ";
    if (visible().id) renderId();
    renderJobs();
    renderWallets();
    renderAddon();
}

// Wallet changes count up over twenty frames instead of snapping to the total.
function animateWallets() {
    const wallets = player.state.user.wallets || {};
    for (const key in wallets) {
        const from = walletValues[key];
        const to = wallets[key].text;
        if (from === undefined) { walletValues[key] = to; continue; }
        countTo(from, to, value => { walletValues[key] = value; renderWallets(); });
    }
}

function onPlayerChanged() {
    animateWallets();
    render();
}

export function register(bus) {
    host = document.getElementById("player-displayer");
    build();
    bus.on("SET_PLAYER_DATA", data => setData(data));
    player.subscribe(onPlayerChanged);
    config.subscribe(render);
    render();
}
