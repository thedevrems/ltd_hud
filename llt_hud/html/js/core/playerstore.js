import { createStore } from "./state.js";

export const player = createStore("player", {
    steamName: "",
    user: {
        name: "Mark Smith",
        id: 183,
        base: {
            job: { type: "job", text: "Police - Officer III", icon: "fas fa-briefcase" },
            job2: { type: "job", text: "Unemployed", icon: "fas fa-briefcase" }
        },
        wallets: {
            cash: { type: "cash", text: 500, icon: "fas fa-wallet" },
            bank: { type: "bank", text: 500, icon: "fas fa-credit-card" }
        }
    }
});

export function setSteamName(name) {
    player.state.steamName = name;
    player.emit();
}

// SET_PLAYER_DATA flattens the identity and sorts the wallets alphabetically.
export function setData(data) {
    const user = player.state.user;
    user.name = data.firstname + " " + data.lastname;
    user.id = data.id;
    user.base = data.base;
    user.wallets = sortedWallets(data.wallets);
    user.addon = data.addon;
    player.emit();
}

function sortedWallets(wallets) {
    return Object.keys(wallets).sort().reduce((sorted, key) => {
        sorted[key] = wallets[key];
        return sorted;
    }, {});
}
