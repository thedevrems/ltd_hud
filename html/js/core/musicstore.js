import { createStore } from "./state.js";

const FADE_STEP = 10;

export const music = createStore("music", {
    player: null,
    currentTrack: null,
    fadeInterval: null,
    canUse: false,
    volume: 0
});

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
