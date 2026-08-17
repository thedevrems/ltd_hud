import { animate } from "./dom.js";

export const EASING = "cubic-bezier(0.075, 0.82, 0.165, 1)";
export const DURATION = 1000;

// The keyframes anime.js played for every component that offers an animation.
export const ENTER_FRAMES = {
    fade: { opacity: [0, 1] },
    zoom: { opacity: [0, 1], transform: ["scale(.3)", "scale(1)"] },
    from_left: { opacity: [0, 1], transform: ["translateX(-6vw)", "translateX(0vw)"] },
    from_top: { opacity: [0, 1], transform: ["translateY(-6vw)", "translateY(0vw)"] },
    from_right: { opacity: [0, 1], transform: ["translateX(6vw)", "translateX(0vw)"] },
    from_bottom: { opacity: [0, 1], transform: ["translateY(6vw)", "translateY(0vw)"] }
};

export const LEAVE_FRAMES = {
    fade: { opacity: [1, 0] },
    zoom: { opacity: [1, 0], transform: ["scale(1)", "scale(.3)"] },
    from_left: { opacity: [1, 0], transform: ["translateX(0vw)", "translateX(-6vw)"] },
    from_top: { opacity: [1, 0], transform: ["translateY(0vw)", "translateY(-6vw)"] },
    from_right: { opacity: [1, 0], transform: ["translateX(0vw)", "translateX(6vw)"] },
    from_bottom: { opacity: [1, 0], transform: ["translateY(0vw)", "translateY(6vw)"] }
};

// An unset animation fades; an unknown name leaves the element as it is.
export function playFrames(table, node, name, options) {
    if (!node) return null;
    const frames = name ? table[name] : table.fade;
    if (!frames) return null;
    return animate(node, frames, Object.assign({ duration: DURATION, easing: EASING }, options));
}
