import { createStore } from "./state.js";

export const welcome = createStore("welcome", {
    staggerTransition: false,
    previewVisible: false
});

export function setStaggerTransition(state) {
    welcome.set("staggerTransition", state);
}

export function setPreviewVisible(state) {
    welcome.set("previewVisible", state);
}
