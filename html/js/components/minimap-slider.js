import { el, setClass, animate, setImageSource } from "../core/dom.js";
import { config } from "../core/config.js";
import { game } from "../core/gamestore.js";
import { minimap } from "../core/minimapstore.js";
import { base } from "../core/basestore.js";

const EASING = "cubic-bezier(0.075, 0.82, 0.165, 1)";
const SWEEP = 400;
const HOLD = 200;

let slider = null;
let logo = null;
let overlay = null;
let shadow = null;
let innerGlow = null;
let height = 0;
let progress = 0;
let previousState = false;
let ticker = null;

export function build(host) {
    slider = el("div", "minimap-slider");
    logo = el("div", "logo");
    logo.appendChild(el("img"));
    slider.appendChild(logo);
    overlay = el("div", "minimap-overlay");
    shadow = el("div", "minimap-option-shadow");
    innerGlow = el("div", "minimap-option-innerglow");
    overlay.append(shadow, innerGlow);
    host.append(slider, overlay);
}

// The bar height tracks the game radar rectangle, minus the .75vh gutter.
function measure() {
    height = minimap.state.base.height - .75;
}

function renderLogo() {
    const use = config.state.UI.UseLogoOnMinimapAnimation;
    logo.style.display = use ? "" : "none";
    setImageSource(logo.firstChild, config.state.Server.Logo);
}

function renderOverlay() {
    const options = game.state.misc.options;
    setClass(overlay, "active", progress > 0);
    overlay.style.height = height + "vh";
    const edge = 100 - progress + "%";
    overlay.style.clipPath =
        `polygon(-.5vw ${edge}, 100% ${edge}, 100% calc(100% + .5vw), -.5vw calc(100% + .5vw))`;
    shadow.style.display = options.use_minimap_overlay && options.minimap_outline ? "" : "none";
    innerGlow.style.display = options.use_minimap_overlay && options.minimap_innershadow ? "" : "none";
}

// anime.js reports a linear progress across delay + duration; rAF matches it.
function trackProgress(span, invert) {
    if (ticker) cancelAnimationFrame(ticker);
    const started = performance.now();
    const step = now => {
        const ratio = Math.min(1, (now - started) / span) * 100;
        progress = invert ? 100 - ratio : ratio;
        renderOverlay();
        if (ratio < 100) ticker = requestAnimationFrame(step);
    };
    ticker = requestAnimationFrame(step);
}

function sweepHeight(delay) {
    animate(slider, [{ height: 0 }, { height: height + "vh" }], { duration: SWEEP, easing: EASING, delay });
}

function retractHeight() {
    animate(slider, [{ height: height + "vh" }, { height: 0 }],
        { duration: SWEEP, delay: HOLD, easing: EASING });
}

function slideMargin(from, to, invert) {
    trackProgress(SWEEP + (invert ? 0 : HOLD), invert);
    animate(slider, [{ marginBottom: from }, { marginBottom: to }],
        { duration: SWEEP, delay: invert ? 0 : HOLD, easing: EASING });
    setTimeout(() => { slider.style.marginBottom = to; }, SWEEP + (invert ? 0 : HOLD));
}

// Showing waits out the first sweep; hiding runs both animations at once.
function runAnimation(visible) {
    if (!visible) {
        slideMargin(height + "px", "0px", true);
        sweepHeight(0);
        setTimeout(() => { previousState = visible; retractHeight(); }, SWEEP);
        return;
    }
    sweepHeight(0);
    setTimeout(() => {
        previousState = visible;
        retractHeight();
        slideMargin("0px", height + "vh", false);
    }, SWEEP);
}

function animateRadarHeight(visible) {
    if (previousState === visible) return;
    if (config.state.DisableMinimapAnimation) {
        previousState = visible;
        slider.style.marginBottom = visible ? height + "vh" : 0;
        return;
    }
    runAnimation(visible);
}

export function refresh() {
    measure();
    renderLogo();
    renderOverlay();
    animateRadarHeight(minimap.state.isVisible);
}

export function register() {
    measure();
    minimap.subscribe(refresh);
    base.subscribe(refresh);
    config.subscribe(refresh);
    game.subscribe(renderOverlay);
    refresh();
}
