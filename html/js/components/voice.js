import { voice, setVoiceVisible, setPlayerTalking, setVoiceData } from "../core/voicestore.js";
import { setClass, setText } from "../core/dom.js";

let host = null;
let icon = null;
let label = null;
let value = null;

// A flash from the game or an open mic both reveal the indicator.
function render() {
    if (!host) return;
    const state = voice.state;
    setClass(host, "visible", state.visible || state.playerTalking);
    setClass(icon, "active", state.playerTalking);
    setText(label, state.label);
    value.style.width = state.value + "%";
}

export function register(bus) {
    host = document.getElementById("voice-indicator");
    icon = host.querySelector(".row > .icon");
    label = host.querySelector(".row > .text");
    value = host.querySelector(".progress > .value");
    bus.on("SET_VOICE_INDICATOR_AS_VISIBLE", data => setVoiceVisible(data.state));
    bus.on("SET_VOICE_INDICATOR_PLAYER_TALKING", data => setPlayerTalking(data.state));
    bus.on("SET_VOICE_INDICATOR_DATA", data => setVoiceData(data));
    voice.subscribe(render);
    render();
}
