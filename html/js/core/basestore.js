import { createStore } from "./state.js";

export const base = createStore("base", {
    isDebug: false,
    isGameVisible: false,
    isCinematicFocusModeOn: false,
    isDataLoaded: false,
    lastUIState: false,
    interfaceMetadata: { carhud: {}, hud: {} }
});

export function setInterfaceMetadata(name, key, value) {
    if (!base.state.interfaceMetadata[name]) base.state.interfaceMetadata[name] = {};
    base.state.interfaceMetadata[name][key] = value;
    base.emit();
}

export function getInterfaceMetadata(name, key) {
    return base.state.interfaceMetadata[name][key];
}

export function setIsGameVisible(state) {
    base.state.isGameVisible = state;
    base.state.lastUIState = state;
    base.emit();
}

// Losing the data flag hides the UI, regaining it restores the previous state.
export function setIsDataLoaded(state) {
    const s = base.state;
    s.isDataLoaded = state;
    if (s.isGameVisible && !state) {
        s.lastUIState = s.isGameVisible;
        s.isGameVisible = false;
    }
    if (!s.isGameVisible && state && s.lastUIState) s.isGameVisible = true;
    base.emit();
}

export function setCinematicFocusMode(state) {
    base.state.isCinematicFocusModeOn = state;
    base.emit();
}
