import { el, setStyle } from "../core/dom.js";
import {
    music, setPlayer, setAsReady, play, fade, stateNameOf, setCurrentState, setTrackData, trackProgress
} from "../core/musicstore.js";

const DEFAULT_VIDEO = "bN3OKJ_lbK0";
const PLAYER_SIZE = "1";
const FADE_DURATION = 350;
const VOLUME_STEP = 15;
const NOEMBED = "https://noembed.com/embed?url=https://www.youtube.com/watch?v=";
const HOST_STYLE = {
    position: "absolute", left: "0", top: "0", opacity: "0",
    width: "1px", height: "1px", "pointer-events": "none"
};

// HANDLE_MUSIC targets, rebuilt on every message from the current volume.
function volumeTargets() {
    const volume = music.state.volume;
    return {
        START: volume,
        STOP: 0,
        VOLUME_UP: volume + VOLUME_STEP > 100 ? 100 : volume + VOLUME_STEP,
        VOLUME_DOWN: volume / 2
    };
}

// Title, author and cover art come from the public noembed endpoint.
function loadTrackData() {
    fetch(NOEMBED + music.state.currentTrack).then(response => {
        if (!response.ok) throw new Error("Network response was not ok " + response.statusText);
        return response.json();
    }).then(payload => {
        setTrackData({ author: payload.author_name, title: payload.title, img: payload.thumbnail_url });
    }).catch(error => {
        console.error("There has been a problem with your fetch operation:", error);
    });
}

function onStateChange(event) {
    const name = stateNameOf(event.data);
    setCurrentState(name);
    const player = music.state.player;
    if (!player || !player.playVideo) return;
    trackProgress(false);
    if (name === "ENDED" || name === "PAUSED") return play();
    if (name !== "PLAYING") return;
    loadTrackData();
    trackProgress(true);
}

function initPlayer(host) {
    return new window.YT.Player(host, {
        height: PLAYER_SIZE,
        width: PLAYER_SIZE,
        videoId: DEFAULT_VIDEO,
        events: {
            onReady: event => setPlayer(event.target),
            onError: event => console.error("YouTube Player error", event.data),
            onStateChange
        }
    });
}

// The iframe API is optional: without it the player stays null and calls no-op.
function mount(root) {
    const wrapper = el("div");
    setStyle(wrapper, HOST_STYLE);
    const host = el("div");
    wrapper.appendChild(host);
    root.appendChild(wrapper);
    if (window.YT && window.YT.Player) return initPlayer(host);
    window.onYouTubeIframeAPIReady = () => initPlayer(host);
}

export function register(bus) {
    mount(document.getElementById("music-root"));
    bus.on("HANDLE_MUSIC", data => fade(volumeTargets()[data.state], FADE_DURATION));
    bus.on("OVERRIDE_MUSIC_STATE", () => setAsReady());
}
