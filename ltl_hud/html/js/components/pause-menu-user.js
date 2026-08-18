import { el, clear, setText, setStyle, setClass } from "../core/dom.js";
import { config } from "../core/config.js";
import { ui } from "../core/i18n.js";
import { formatCurrency } from "../core/format.js";
import { pauseMenu } from "../core/pausemenustore.js";
import { openUrl } from "../core/nui.js";

const DEFAULT_LINKS = {
    youtube: { label: "YouTube", icon: "fab fa-youtube", url: "https://www.youtube.com/", use: true },
    store: { label: "Boutique", icon: "fas fa-globe", url: "https://www.mywebsite.com", use: true },
    discord: { label: "Discord", icon: "fab fa-discord", url: "https://discord.gg", use: true }
};

function userDataConfig() {
    return (config.state.PauseMenu && config.state.PauseMenu.UserData) || {};
}

// A missing mugshot collapses the avatar into a thin marker.
function renderAvatar(node) {
    const mugshot = pauseMenu.state.user.mugshot;
    const shown = mugshot && userDataConfig().mugshot;
    setClass(node, "smaller", !shown);
    clear(node);
    if (mugshot) node.appendChild(el("img", null, { src: mugshot }));
}

function buildUsername(user) {
    const box = el("div", "username");
    const name = el("div", "name");
    name.appendChild(document.createTextNode(user.name));
    // L'UUID du personnage plutôt que l'identifiant serveur : il ne change pas
    // d'une session à l'autre, et c'est lui que prennent les commandes du
    // framework, donc c'est celui qu'un joueur a besoin de pouvoir lire. Absent,
    // le crochet disparaît au lieu d'afficher une paire vide.
    if (user.uuid) {
        const span = el("span");
        setText(span, "[" + user.uuid + "]");
        name.appendChild(document.createTextNode(" "));
        name.appendChild(span);
    }
    box.appendChild(name);
    return box;
}

// Métier, gang et « petite frappe » partagent une seule mise en forme : un
// libellé suivi d'un grade. Le gang porte son rang, la petite frappe porte
// « Oui » ou « Non », et les trois s'empilent sous le nom.
//
// Les deux dernières lignes sont marquées `secondary` : sans cela, trois lignes
// identiques sous le nom se lisent comme un seul bloc, et rien ne dit laquelle
// est le métier. La hiérarchie fait le travail que des icônes feraient dans le
// bandeau, où elles existent.
function buildIdentityLine(entry, secondary) {
    const box = el("div", secondary ? "job secondary" : "job");
    const label = el("div", "label");
    setText(label, entry.label);
    const grade = el("div", "grade");
    setText(grade, entry.grade);
    box.appendChild(label);
    box.appendChild(grade);
    return box;
}

function buildWallet(wallet) {
    const box = el("div", "wallet");
    const type = el("div", "type");
    setText(type, ui("pause_menu." + wallet.name));
    const value = el("div", "value");
    setText(value, formatCurrency(wallet.value, config.state.Currency, {
        removeDecimals: !!config.state.UI.RemoveDecimalsFromWallets
    }));
    box.appendChild(type);
    box.appendChild(value);
    return box;
}

function buildWallets(user) {
    const box = el("div", "wallets");
    Object.values(user.wallets).forEach(wallet => box.appendChild(buildWallet(wallet)));
    return box;
}

// Each identity block is opt-in through Config.PauseMenu.UserData.
export function renderUser(avatar, column) {
    const user = pauseMenu.state.user;
    const shown = userDataConfig();
    renderAvatar(avatar);
    clear(column);
    if (shown.user_firstname_and_lastname) column.appendChild(buildUsername(user));
    if (shown.job_list && user.job) column.appendChild(buildIdentityLine(user.job, false));
    if (shown.gang_list && user.gang) column.appendChild(buildIdentityLine(user.gang, true));
    if (shown.thug && user.thug) column.appendChild(buildIdentityLine(user.thug, true));
    if (shown.wallets_list) column.appendChild(buildWallets(user));
}

function buildServerNav(link) {
    const node = el("div", "server-nav");
    const icon = el("div", "icon");
    icon.appendChild(el("i", link.icon));
    node.appendChild(icon);
    const text = el("div", "text");
    setText(text, link.label);
    node.appendChild(text);
    setStyle(node, { display: link.use ? "flex" : "none" });
    node.onclick = () => openUrl(link.url);
    return node;
}

// The three server shortcuts always render, hidden ones included.
export function renderServerNavs(host) {
    const links = (config.state.PauseMenu && config.state.PauseMenu.NavbarElements) || {};
    clear(host);
    for (const key in DEFAULT_LINKS) {
        host.appendChild(buildServerNav(links[key] || DEFAULT_LINKS[key]));
    }
}
