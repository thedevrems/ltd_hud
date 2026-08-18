import { createStore, readPath } from "./state.js";

const DEFAULTS = {
    UI: {
        main_menu: {
            connected_in_as: "Connected in as",
            press_enter: "Press <span>ENTER</span> to continue",
            hello: "Hello",
            music_text: "Please provide your music theme you'd like to use.",
            begin: "Let's begin"
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
