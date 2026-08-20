import { voice, setVoiceVisible, setPlayerTalking, setVoiceData } from "../core/voicestore.js";
import { setClass, setText } from "../core/dom.js";

let host = null;
let icon = null;
let label = null;
let value = null;

// Visibility is the Lua side's call and only its call. This used to add "or the
// mic is open" of its own accord, which meant the block could be on screen while
// Lua believed it had hidden it -- and left no way to turn that reveal off from
// the config, since the page was doing it. Talking now only lights the pip.
function render() {
    if (!host) return;
    const state = voice.state;
    setClass(host, "visible", state.visible);
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
