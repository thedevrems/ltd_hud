import { createStore } from "./state.js";

const DEFAULT_NAVBAR = {
    ui: { name: "ui", path: { type: "UISettings" }, icon: "UI" },
    settings: { name: "settings", path: { type: "game", value: "settings" }, icon: "fas fa-cog" },
    map: { name: "map", path: { type: "game", value: "map" }, icon: "fas fa-map" }
};

export const pauseMenu = createStore("pausemenu", {
    user: {
        name: "Mark Smith",
        id: 183,
        job: { label: "LSPD", grade: "Officer III" },
        wallets: {
            cash: { name: "cash", value: 500 },
            bank: { name: "bank", value: 90500 }
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
    if (data.id) user.id = data.id;
    if (data.base) user.job = { label: data.base.job.label, grade: data.base.job.grade };
    if (data.wallets) assignWallets(user, data.wallets);
    if (data.mugshot) user.mugshot = data.mugshot;
    pauseMenu.emit();
}

function assignWallets(user, wallets) {
    for (const [name, wallet] of Object.entries(wallets)) {
        user.wallets[name] = { name, value: Number(wallet.text) };
    }
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
