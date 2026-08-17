const FRAME = 16;

// Create an element with an optional class list and property bag.
export function el(tag, className, props) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (props) Object.assign(node, props);
    return node;
}

// SVG nodes need their own namespace and take attributes rather than properties.
export function svgEl(tag, attrs) {
    const node = document.createElementNS("http://www.w3.org/2000/svg", tag);
    for (const key in attrs) node.setAttribute(key, attrs[key]);
    return node;
}

export function qs(selector, root) {
    return (root || document).querySelector(selector);
}

export function clear(node) {
    while (node.firstChild) node.removeChild(node.firstChild);
}

export function setClass(node, name, enabled) {
    node.classList.toggle(name, !!enabled);
}

// Apply a map of class name -> boolean in one call.
export function setClasses(node, map) {
    for (const name in map) node.classList.toggle(name, !!map[name]);
}

export function setStyle(node, styles) {
    for (const key in styles) node.style.setProperty(key, styles[key]);
}

export function setText(node, value) {
    node.textContent = value == null ? "" : String(value);
}

// Mirrors v-html: the build renders server-provided markup verbatim.
export function setHTML(node, markup) {
    node.innerHTML = markup == null ? "" : String(markup);
}

export function nextFrame(callback) {
    requestAnimationFrame(() => requestAnimationFrame(callback));
}

// Longest transition or animation declared on the node, in milliseconds.
export function durationOf(node) {
    const style = getComputedStyle(node);
    const parts = [style.transitionDuration, style.transitionDelay, style.animationDuration];
    const total = parts.map(toLongestSeconds).reduce((a, b) => a + b, 0);
    return Math.round(total * 1000);
}

function toLongestSeconds(value) {
    if (!value) return 0;
    const times = value.split(",").map(part => parseFloat(part) || 0);
    return Math.max(0, ...times);
}

// Vue <Transition> enter phase, reproduced with plain classes.
export function enterTransition(node, name, onDone) {
    const active = `${name}-enter-active`;
    node.classList.add(active, `${name}-enter-from`);
    nextFrame(() => {
        node.classList.remove(`${name}-enter-from`);
        node.classList.add(`${name}-enter-to`);
        const done = () => {
            node.classList.remove(active, `${name}-enter-to`);
            if (onDone) onDone();
        };
        setTimeout(done, durationOf(node) + FRAME);
    });
}

// Vue <Transition> leave phase, reproduced with plain classes.
export function leaveTransition(node, name, onDone) {
    const active = `${name}-leave-active`;
    node.classList.add(active, `${name}-leave-from`);
    nextFrame(() => {
        node.classList.remove(`${name}-leave-from`);
        node.classList.add(`${name}-leave-to`);
        const done = () => {
            node.classList.remove(active, `${name}-leave-to`);
            if (onDone) onDone();
        };
        setTimeout(done, durationOf(node) + FRAME);
    });
}

// Web Animations wrapper for easings CSS classes cannot express.
export function animate(node, keyframes, options) {
    if (!node || !node.animate) return null;
    const animation = node.animate(keyframes, Object.assign({ fill: "forwards" }, options));
    return animation;
}
