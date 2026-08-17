import { el, setText, setClass, animate } from "../core/dom.js";
import { register as registerScreen, push, current, subscribe } from "../core/screens.js";
import { music, setAsReady, changeMusic, play, fade } from "../core/musicstore.js";
import { config } from "../core/config.js";
import { language, ui } from "../core/i18n.js";
import sfx from "../core/sfx.js";

const PATH = "/welcome/music";
const EASING = "cubic-bezier(0.075, 0.82, 0.165, 1)";
const DURATION = 1000;
const ERROR_DELAY = 1500;
const PLAY_DELAY = 150;
const FADE_DURATION = 350;
const DONE_DELAY = 1500;
const PRESETS_DELAY = 3000;
const INTRO = [
    { part: "header", delay: 1400, top: ["55%", "50%"] },
    { part: "column", delay: 2200, top: ["60%", "57.5%"] },
    { part: "defaults", delay: 2500, top: ["72.5%", "70%"] }
];

let screen = null;
let mounted = false;
let parts = {};

function build() {
    const basic = el("div", "basic-content");
    parts.header = el("div", "header");
    parts.column = el("div", "column");
    parts.text = el("div", "text");
    parts.input = el("input", null, { type: "text" });
    parts.column.append(parts.text, parts.input);
    parts.defaults = el("div", "default-music-set");
    basic.append(parts.header, parts.column, parts.defaults);
    parts.basic = basic;
    parts.done = el("div", "done-content");
    screen.append(basic, parts.done);
}

// The three blocks rise into place one after the other once the screen mounts.
function playIntro() {
    INTRO.forEach(step => {
        animate(parts[step.part], { opacity: [0, 1], top: step.top },
            { duration: DURATION, delay: step.delay, easing: EASING });
    });
}

function startTrack(url) {
    setAsReady();
    changeMusic(url);
    sfx.plum.play();
    setTimeout(() => {
        play();
        fade(music.state.volume, FADE_DURATION);
    }, PLAY_DELAY);
}

// Once a track is picked the form leaves upward and the closing word takes over.
function playOutro() {
    animate(parts.basic, { top: ["0vw", "-20vw"], opacity: [1, 0] }, { duration: DURATION, easing: EASING });
    const rise = animate(parts.done, { top: ["10vw", "0vw"], opacity: [0, 1] },
        { duration: DURATION, delay: 400, easing: EASING });
    if (rise) rise.onfinish = () => setTimeout(leaveScreen, DONE_DELAY);
    else setTimeout(leaveScreen, DONE_DELAY);
}

function leaveScreen() {
    sfx.woosh2.play();
    push("/welcome");
    setTimeout(() => {
        sfx.woosh.play();
        push("/welcome/presets");
    }, PRESETS_DELAY);
}

function acceptTrack(url) {
    startTrack(url);
    playOutro();
}

function isYoutubeUrl(url) {
    if (!url.includes("https://")) return false;
    return url.includes("youtube") || url.includes("youtu.be");
}

// Pasting is the only way in: a bad link flashes the field red instead.
function onPaste(event) {
    const url = event.clipboardData.getData("text");
    if (!url) return;
    if (isYoutubeUrl(url)) return acceptTrack(url);
    setClass(parts.input, "error", true);
    setTimeout(() => setClass(parts.input, "error", false), ERROR_DELAY);
}

function render() {
    setText(parts.header, ui("main_menu.hello"));
    setText(parts.text, ui("main_menu.music_text"));
    parts.input.placeholder = ui("main_menu.paste_youtube");
    setText(parts.defaults, ui("main_menu.default_music"));
    setText(parts.done, ui("main_menu.begin"));
}

// The build mounted the screen on every visit, replaying the intro each time.
function onRouteChanged() {
    const inside = current() === PATH;
    if (inside && !mounted) playIntro();
    mounted = inside;
}

// The "/welcome/music" child: pick the theme that plays under the main menu.
export function register() {
    screen = el("div", "music-content");
    build();
    registerScreen(PATH, screen);
    parts.defaults.onclick = () => acceptTrack(config.state.DefaultMusic);
    parts.input.onpaste = onPaste;
    language.subscribe(render);
    subscribe(onRouteChanged);
    render();
    onRouteChanged();
}
