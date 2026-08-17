import { createStore } from "./state.js";
import { writeJSON } from "./storage.js";

const FADE_STEP = 10;
const VIDEO_ID = /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?&v=|.*[?&]v=))([^?&]+)(?:[?&]|\b)/;

export const music = createStore("music", {
    player: null,
    currentTrack: null,
    fadeInterval: null,
    canUse: false,
    currentState: "NOT_CREATED",
    volume: 0,
    data: { author: "", title: "", img: "", progress: 0 }
});

export function extractVideoId(url) {
    const match = url.match(VIDEO_ID);
    return match && match[1] ? match[1] : null;
}

function persist() {
    writeJSON("music_storage", { url: music.state.currentTrack, volume: music.state.volume });
}

// The stored slot seeds the track and the volume the settings slider shows.
export function setStorageData(payload) {
    if (!payload || !payload.url) return;
    music.state.currentTrack = payload.url.includes("https://") ? extractVideoId(payload.url) : payload.url;
    music.state.volume = payload.volume;
    music.emit();
}

export function changeMusic(url) {
    if (!url) return;
    const id = url.includes("youtu.be") || url.includes("youtube") ? extractVideoId(url) : url;
    if (!id) return;
    music.state.currentTrack = id;
    music.emit();
    const player = music.state.player;
    if (!player || !player.loadVideoById) return;
    player.loadVideoById(id);
    persist();
}

export function changeVolume(value) {
    const player = music.state.player;
    if (!player || !player.setVolume) return;
    music.state.volume = value;
    player.setVolume(value);
    music.emit();
    persist();
}

function canFade(player) {
    return player && player.seekTo != null && music.state.canUse;
}

// Ramps the player volume to a target over `duration`, in 10ms steps.
export function fade(target, duration) {
    const player = music.state.player;
    if (!canFade(player)) return;
    if (music.state.fadeInterval) clearInterval(music.state.fadeInterval);
    const from = player.getVolume();
    const steps = duration / FADE_STEP;
    const delta = (target - from) / steps;
    let step = 0;
    music.state.fadeInterval = setInterval(() => {
        if (step < steps) return player.setVolume(from + step++ * delta);
        player.setVolume(target);
        clearInterval(music.state.fadeInterval);
    }, FADE_STEP);
}
