import { createStore } from "./state.js";
import { scoped, provide } from "./debug.js";

const debug = scoped("visibility");

export const base = createStore("base", {
    isDebug: false,
    isGameVisible: false,
    isCinematicFocusModeOn: false,
    isDataLoaded: false,
    lastUIState: false,
    interfaceMetadata: { carhud: {}, hud: {} }
});

// isGameVisible drives ".ui-screen.visible", which every hud layer opacity keys
// off. It only ever flips through SET_UI_VISIBLE / SET_UI_DATA_STATUS, so the
// trace records who moved it and when.
provide("visibility", () => ({
    isGameVisible: base.state.isGameVisible,
    isDataLoaded: base.state.isDataLoaded,
    lastUIState: base.state.lastUIState,
    isCinematicFocusModeOn: base.state.isCinematicFocusModeOn,
    hint: base.state.isGameVisible
        ? "hud layers are allowed to paint"
        : "hud layers are transparent: Lua never sent SET_UI_VISIBLE {state=true}"
}));

export function setInterfaceMetadata(name, key, value) {
    if (!base.state.interfaceMetadata[name]) base.state.interfaceMetadata[name] = {};
    base.state.interfaceMetadata[name][key] = value;
    base.emit();
}

export function getInterfaceMetadata(name, key) {
    return base.state.interfaceMetadata[name][key];
}

export function setIsGameVisible(state) {
    debug.log(`SET_UI_VISIBLE: isGameVisible ${base.state.isGameVisible} -> ${!!state}`);
    base.state.isGameVisible = state;
    base.state.lastUIState = state;
    base.emit();
}

// Losing the data flag hides the UI, regaining it restores the previous state.
export function setIsDataLoaded(state) {
    const s = base.state;
    const before = s.isGameVisible;
    s.isDataLoaded = state;
    if (s.isGameVisible && !state) {
        s.lastUIState = s.isGameVisible;
        s.isGameVisible = false;
    }
    if (!s.isGameVisible && state && s.lastUIState) s.isGameVisible = true;
    debug.log(`SET_UI_DATA_STATUS ${!!state}: isGameVisible ${before} -> ${s.isGameVisible} (lastUIState=${s.lastUIState})`);
    base.emit();
}

export function setCinematicFocusMode(state) {
    debug.trace(`cinematic focus mode -> ${!!state}`);
    base.state.isCinematicFocusModeOn = state;
    base.emit();
}
