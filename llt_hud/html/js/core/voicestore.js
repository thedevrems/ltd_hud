import { createStore } from "./state.js";

export const voice = createStore("voice", {
    value: 50,
    label: "Normal",
    playerTalking: false,
    visible: false
});

export function setVoiceVisible(state) {
    voice.state.visible = state;
    voice.emit();
}

export function setPlayerTalking(state) {
    voice.state.playerTalking = state;
    voice.emit();
}

// Proximity mode ships the label and the matching gauge value together.
export function setVoiceData(data) {
    voice.state.value = data.value;
    voice.state.label = data.label;
    voice.emit();
}
