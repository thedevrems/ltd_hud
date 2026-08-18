import { createStore } from "./state.js";
import { writeJSON } from "./storage.js";
import { post } from "./nui.js";

const FADE_STEP = 10;
const PLAYER_DELAY = 100;
const PLAYBACK_RETRY = 1000;
const PROGRESS_STEP = 1000;
const VIDEO_ID = /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?&v=|.*[?&]v=))([^?&]+)(?:[?&]|\b)/;
const STATE_NAMES = { "-1": "UNSTARTED", 0: "ENDED", 1: "PLAYING", 2: "PAUSED", 3: "BUFFERING", 5: "CUED" };

export const music = createStore("music", {
    player: null,
    isPlaying: false,
    currentTrack: null,
    fadeInterval: null,
    timeInterval: null,
    canUse: false,
    currentState: "NOT_CREATED",
    volume: 0,
    data: { author: "", title: "", img: "", progress: 0 }
});

export function setAsReady() {
    music.state.canUse = true;
    music.emit();
}

export function isReady() {
    return music.state.canUse === true && music.state.player != null;
}

export function stateNameOf(code) {
    return STATE_NAMES[String(code)];
}

export function setCurrentState(name) {
    music.state.currentState = name;
    music.emit();
}

export function setTrackData(payload) {
    Object.assign(music.state.data, payload);
    music.emit();
}

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

// The build waits 100ms before adopting the player, then tells Lua it exists.
export function setPlayer(player) {
    setTimeout(() => {
        music.state.player = player;
        changeMusic(music.state.currentTrack);
        player.setVolume(0);
        music.emit();
        post("player.created", {});
        if (!player.setVolume) setTimeout(() => player.playVideo(), PLAYBACK_RETRY);
    }, PLAYER_DELAY);
}

export function play() {
    const player = music.state.player;
    if (!player || !player.playVideo) return;
    player.playVideo();
    music.state.isPlaying = true;
    music.emit();
}

// Progress feeds the settings track block while the video is playing.
export function trackProgress(state) {
    clearInterval(music.state.timeInterval);
    if (!state) return;
    music.state.timeInterval = setInterval(() => {
        const player = music.state.player;
        music.state.data.progress = player.getCurrentTime() / player.getDuration() * 100;
        music.emit();
    }, PROGRESS_STEP);
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
