import { createStore } from "./state.js";
import { BASE_ORDER, WALLET_ORDER, inOrder } from "./playerstore.js";

const DEFAULT_NAVBAR = {
    ui: { name: "ui", path: { type: "UISettings" }, icon: "UI" },
    settings: { name: "settings", path: { type: "game", value: "settings" }, icon: "fas fa-cog" },
    map: { name: "map", path: { type: "game", value: "map" }, icon: "fas fa-map" }
};

export const pauseMenu = createStore("pausemenu", {
    user: {
        name: "Mark Smith",
        // Affiché à côté du nom : l'UUID du personnage, pas l'identifiant serveur.
        uuid: "a1b2",
        job: { label: "LSPD", grade: "Officer III" },
        // Le gang est un slot parallèle au métier, et « petite frappe » un
        // drapeau indépendant des deux : les trois lignes coexistent.
        gang: { label: "Aucun", grade: "" },
        thug: { label: "Petite frappe", grade: "Non" },
        wallets: {
            cash: { name: "cash", value: 500 },
            bank: { name: "bank", value: 90500 },
            black: { name: "black", value: 0 }
        },
        mugshot: ""
    },
    navbar: Object.assign({}, DEFAULT_NAVBAR)
});

// UPDATE_PAUSEMENU only overwrites the fields the framework actually sent.
export function setData(data) {
    if (!data) return;
    const user = pauseMenu.state.user;
    if (data.firstname && data.lastname) user.name = data.firstname + " " + data.lastname;
    // Vidé quand le serveur n'envoie rien, plutôt que de laisser la valeur de
    // démarrage passer pour l'UUID du joueur. Le crochet disparaît alors.
    user.uuid = data.uuid || "";
    if (data.base) assignIdentity(user, data.base);
    if (data.wallets) assignWallets(user, data.wallets);
    if (data.mugshot) user.mugshot = data.mugshot;
    pauseMenu.emit();
}

// Chaque ligne est facultative : un serveur qui n'envoie pas de gang garde celle
// qui était affichée plutôt que d'afficher un bloc vide. La liste est la même que
// celle du bandeau, donc les deux vues nomment exactement les mêmes lignes.
function assignIdentity(user, base) {
    BASE_ORDER.forEach(key => {
        if (base[key]) user[key] = { label: base[key].label, grade: base[key].grade };
    });
}

// La charge utile fait autorité : les portefeuilles sont remplacés, pas fusionnés
// dans ceux d'avant. Les fusionner laissait les valeurs de démarrage à l'écran —
// un serveur sans argent sale aurait affiché « ARGENT SALE 0 » pour toujours,
// puisque rien n'aurait jamais écrasé le placeholder. C'est aussi ce que fait
// déjà playerstore pour le bandeau.
function assignWallets(user, wallets) {
    const replaced = {};
    // Même ordre de lecture que le bandeau, et pour la même raison : l'ordre des
    // clés de la charge utile vient d'une table Lua, donc il n'en est pas un.
    inOrder(wallets, WALLET_ORDER).forEach(name => {
        replaced[name] = { name, value: Number(wallets[name].text) };
    });
    user.wallets = replaced;
}

// SEND_PAUSEMENU_DATA_BUTTONS either replaces the navbar or relabels the defaults.
export function setNavs(payload) {
    if (payload.useCustomOrder) applyCustomOrder(payload);
    else applySortedOrder(payload.buttons);
    pauseMenu.emit();
}

function applyCustomOrder(payload) {
    const ordered = payload.order.map(name => payload.buttons[name]).filter(Boolean);
    const navbar = {};
    for (const [key, button] of Object.entries(ordered)) navbar[key] = button;
    pauseMenu.state.navbar = navbar;
}

function applySortedOrder(buttons) {
    const navbar = pauseMenu.state.navbar;
    Object.keys(buttons).sort().forEach(name => {
        if (navbar[name]) navbar[name].label = buttons[name].label;
        else navbar[name] = buttons[name];
    });
}
