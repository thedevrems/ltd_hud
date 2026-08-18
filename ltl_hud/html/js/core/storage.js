import { post } from "./nui.js";

// L'interface du joueur vit en base de données, plus dans le cache du client.
//
// Ce module était une façade sur localStorage : chaque créneau y était rangé
// sous "<composant>_storage", donc vider le cache FiveM ou changer de machine
// effaçait le HUD et relançait l'écran de bienvenue. Il tient désormais le même
// document en mémoire, semé par Lua au démarrage depuis `ltl_hud_settings` et
// renvoyé à Lua à chaque écriture. Les clés n'ont pas bougé — ce sont celles que
// `keyFor` produisait déjà, moins le suffixe — pour que le document reste
// lisible en regard des noms de composants du store.

const SLOTS = ["hud", "carhud", "notifies", "progressbar", "helpnotify", "misc", "color", "music"];

// Le document du compte. Vide tant que SEND_FULL_CFG n'a rien apporté, ce qui
// est exactement ce que veut dire « ce joueur n'a pas encore de HUD ».
let account = {};

// Le créneau d'un composant : `progressBar` en mémoire, `progressbar` en base.
export function keyFor(component) {
    return String(component).toLowerCase();
}

// Reprend le document envoyé par Lua, sous la forme de la chaîne JSON telle
// qu'elle sort de MySQL : une table Lua vide traverse le pont NUI tantôt en
// objet tantôt en tableau, et la différence compte ici.
export function seed(payload) {
    account = {};
    if (!payload) return false;

    let parsed = payload;
    if (typeof payload === "string") {
        try {
            parsed = JSON.parse(payload);
        } catch (error) {
            return false;
        }
    }

    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return false;
    account = parsed;
    return true;
}

export function readSlot(slot) {
    const value = account[slot];
    return value && typeof value === "object" ? value : null;
}

export function readComponent(component) {
    return readSlot(keyFor(component));
}

// Range un créneau de composant sans rien envoyer : gamestore poste déjà
// `storage.onUpdate` juste après, et Lua fait suivre au serveur depuis là. Un
// deuxième message ici doublerait chaque cran de curseur.
export function writeComponent(component, value) {
    account[keyFor(component)] = value;
}

// La musique n'a pas de composant dans le store, donc pas de `storage.onUpdate`
// pour la porter : elle a son propre message.
export function writeMusic(value) {
    account.music = value;
    post("storage.onMusicUpdate", value);
}

// L'écran de bienvenue a été traversé. Ce drapeau est ce qui fait qu'il ne
// revient pas à la prochaine connexion, ni sur les autres personnages.
export function isConfigured() {
    return account.configured === true;
}

export function setConfigured() {
    if (account.configured === true) return;
    account.configured = true;
    post("storage.setConfigured", {});
}

// Vide la copie en mémoire. La ligne en base est supprimée par Lua, qui est
// aussi ce qui déclenche REMOVE_STORAGE_FULLY.
export function clearAll() {
    account = {};
}

// Ce que la trace de démarrage montre : les créneaux réellement présents.
export function storedSlots() {
    return SLOTS.filter(slot => account[slot] != null);
}
