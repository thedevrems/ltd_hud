import { createStore, readPath } from "./state.js";

// Ce que la page affiche avant LOAD_UP_TRANSLATIONS. L'indicateur d'arme y
// figure parce que son libellé était écrit en dur dans index.html : il passe
// maintenant par la traduction, et sans repli il resterait vide le temps que
// Lua envoie la table.
const DEFAULTS = {
    UI: {
        main_menu: {
            connected_in_as: "Connecté en tant que",
            press_enter: "Appuyez sur <span>ENTRÉE</span> pour continuer",
            hello: "Bonjour",
            music_text: "Indiquez la musique que vous souhaitez utiliser.",
            begin: "C'est parti"
        },
        weapon_indicator: {
            weapon: "Arme"
        }
    }
};

export const language = createStore("language", DEFAULTS);

// LOAD_UP_TRANSLATIONS ships the whole Lua Translations table at the root.
export function setTranslations(payload) {
    if (!payload) return;
    Object.assign(language.state, payload);
    language.emit();
}

export function t(path, fallback) {
    return readPath(language.state, path, fallback === undefined ? "" : fallback);
}

export function ui(path, fallback) {
    return t("UI." + path, fallback);
}
