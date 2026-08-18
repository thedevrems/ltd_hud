import { createStore } from "./state.js";
import { post } from "./nui.js";

const DEFAULT_ITEMS = [
    { name: "cinematic", label: "Cinematic Mode", isActive: false },
    { name: "cinematic", label: "Hud Settings", isActive: false },
    { name: "cinematic", label: "Map", isActive: false },
    { name: "cinematic", label: "Key Indicators", isActive: false },
    { name: "cinematic", label: "Quit", isActive: false }
];

export const menu = createStore("menu", {
    isVisible: false,
    currentItemIndex: 0,
    menuItems: DEFAULT_ITEMS
});

export function setIsVisible(state) {
    menu.state.isVisible = state;
    menu.emit();
}

// MENU_ON_CHANGE walks the ring in both directions; up moves forward.
export function onChange(isArrowUp) {
    const total = menu.state.menuItems.length;
    const index = menu.state.currentItemIndex;
    menu.state.currentItemIndex = (isArrowUp ? index + 1 : index - 1 + total) % total;
    menu.emit();
}

export function setData(items) {
    menu.state.menuItems = items;
    menu.emit();
}

export function selectCurrent() {
    post("menu.onSelect", menu.state.menuItems[menu.state.currentItemIndex]);
}
