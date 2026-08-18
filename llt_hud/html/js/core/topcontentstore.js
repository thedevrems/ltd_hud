import { createStore } from "./state.js";

export const topContent = createStore("topContent", { isActive: false, currentScreen: "" });

export function setScreen(name) {
    topContent.state.currentScreen = name;
    topContent.emit();
}

export function setActive(state) {
    topContent.state.isActive = state;
    topContent.emit();
}
