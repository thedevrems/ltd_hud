import { animate } from "../core/dom.js";
import sfx from "../core/sfx.js";

const EASING = "cubic-bezier(0.075, 0.82, 0.165, 1)";
const DURATION = 1000;
const BOOT_DELAY = 3000;
const OUTRO_BARS_DURATION = 1500;

const running = [];
let bootTimer = null;
let windTimer = null;

function parts(screen) {
    return {
        bars: [...screen.querySelectorAll(".screen-sliders .bar")],
        topNav: screen.querySelector(".top-nav"),
        text: screen.querySelector(".center .text"),
        logo: screen.querySelector(".center .logo")
    };
}

function run(node, keyframes, options) {
    const animation = animate(node, keyframes, Object.assign({ duration: DURATION, easing: EASING }, options));
    if (animation) running.push(animation);
    return animation;
}

function onFinish(animation, callback) {
    if (!animation) return callback();
    animation.onfinish = callback;
}

// Second half of the intro: the header and the prompt slide in behind the logo.
function revealChrome(screen, onReady) {
    const { topNav, text } = parts(screen);
    screen.classList.add("active");
    run(topNav, { opacity: [0, 1], transform: ["translateY(-5vw)", "translateY(0vw)"] }, { delay: 500 });
    const rise = run(text, { opacity: [0, 1], transform: ["translateY(8vw)", "translateY(5vw)"] }, { delay: 700 });
    onFinish(rise, onReady);
}

export function playIntro(screen, onReady) {
    const { bars, logo } = parts(screen);
    bootTimer = setTimeout(() => {
        windTimer = setTimeout(() => sfx.wind.play(), 500);
        bars.forEach(bar => run(bar, { width: ["100%", "37.5%"] }, { delay: 500 }));
        const grow = run(logo, { opacity: [0, 1], transform: ["scale(.4)", "scale(1)"] });
        onFinish(grow, () => revealChrome(screen, onReady));
    }, BOOT_DELAY);
}

export function playOutro(screen, onDone) {
    const { bars, topNav, text, logo } = parts(screen);
    bars.forEach(bar => run(bar, { width: "50%" }, { duration: OUTRO_BARS_DURATION }));
    run(topNav, { opacity: [1, 0], transform: ["translateY(0vw)", "translateY(-5vw)"] });
    run(text, { opacity: [1, 0], transform: ["translateY(2vw)", "translateY(4vw)"] });
    const shrink = run(logo, { opacity: [1, 0], transform: ["scale(1)", "scale(.4)"] }, { delay: 500 });
    onFinish(shrink, onDone);
}

// Leaving the screen drops every pending timer and animation effect.
export function resetIntro(screen) {
    clearTimeout(bootTimer);
    clearTimeout(windTimer);
    running.forEach(animation => animation.cancel());
    running.length = 0;
    screen.classList.remove("active");
}
