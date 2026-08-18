import { createStore } from "./state.js";

// L'ordre d'affichage des données du joueur ne peut pas venir de la charge utile :
// elle arrive d'une table Lua, et `pairs()` n'y garantit aucun ordre — deux lignes
// pouvaient donc s'échanger d'un démarrage à l'autre. Ces listes sont l'ordre, et
// les deux vues les lisent : le bandeau et le bloc identité du menu pause.
export const BASE_ORDER = ["job", "gang", "thug"];

// Ce qu'on a en poche, ce qu'on a en banque, puis l'illégal. Le tri alphabétique
// d'avant glissait l'argent sale entre la banque et le liquide.
export const WALLET_ORDER = ["cash", "bank", "black"];

// Les clés listées d'abord, dans l'ordre de la liste ; celles qu'un serveur a
// ajoutées de son côté ensuite, dans l'ordre où elles sont arrivées.
export function inOrder(source, order) {
    const known = order.filter(key => source[key] !== undefined);
    const rest = Object.keys(source).filter(key => !order.includes(key));
    return known.concat(rest);
}

export const player = createStore("player", {
    steamName: "",
    user: {
        name: "Mark Smith",
        // `id` est l'identifiant serveur, encore transmis pour les ressources qui
        // le lisent ; `uuid` est le code public à quatre caractères que le
        // bandeau affiche.
        id: 183,
        uuid: "a1b2",
        base: {
            job: { type: "job", text: "Police - Officer III", icon: "fas fa-briefcase" },
            gang: { type: "gang", text: "Aucun", icon: "fas fa-users" },
            thug: { type: "thug", text: "Petite frappe : Non", icon: "fas fa-user-secret" }
        },
        wallets: {
            cash: { type: "cash", text: 500, icon: "fas fa-wallet" },
            bank: { type: "bank", text: 500, icon: "fas fa-credit-card" },
            black: { type: "black", text: 0, icon: "fas fa-money-bill-wave" }
        }
    }
});

export function setSteamName(name) {
    player.state.steamName = name;
    player.emit();
}

// SET_PLAYER_DATA flattens the identity and puts the wallets in reading order.
export function setData(data) {
    const user = player.state.user;
    user.name = data.firstname + " " + data.lastname;
    user.id = data.id;
    // Vidé plutôt que laissé tel quel quand le serveur n'envoie rien : garder la
    // valeur de démarrage afficherait un UUID inventé, que le joueur lirait comme
    // le sien. Quatre cases estompées disent « pas encore d'UUID ».
    user.uuid = data.uuid || "";
    user.base = data.base;
    user.wallets = orderedWallets(data.wallets);
    user.addon = data.addon;
    player.emit();
}

function orderedWallets(wallets) {
    return inOrder(wallets, WALLET_ORDER).reduce((ordered, key) => {
        ordered[key] = wallets[key];
        return ordered;
    }, {});
}
