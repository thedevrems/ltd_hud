import { el, svgEl, setClasses } from "../core/dom.js";

const ICON_SIZE = ".75vw";
const HEXAGON_OUTLINE = "M26.13 97.5029L195 0.00577491L363.87 97.5029V292.497L195 389.994L26.13 292.497V97.5029Z";
const HEXAGON_FILL = "M195 41L328.368 118V272L195 349L61.6321 272V118L195 41Z";
const SQUARE_SIDE = 396;

let maskSerial = 0;

function iconTag(icon) {
    return el("i", icon);
}

function iconBox(child, size) {
    const box = el("div", "icon");
    box.style.fontSize = size || ICON_SIZE;
    box.appendChild(child);
    return box;
}

function fillBar(node, value, color) {
    node.style.height = value + "%";
    node.style.backgroundColor = color;
}

// The dash length only becomes measurable once the shape has been laid out.
function measure(node) {
    if (!node.getTotalLength || !node.getClientRects().length) return 0;
    return node.getTotalLength();
}

function applyStroke(node, value, dash) {
    node.style.strokeDasharray = dash;
    node.style.strokeDashoffset = dash * (value / 100) - dash;
}

// Basic, skew and diamond share one shell: a vertical fill behind the icon.
function buildFilled(name, icon, size) {
    const root = el("div", `hud-element hud-${name}`);
    const progress = el("div", "progress");
    root.append(progress, iconBox(iconTag(icon), size));
    return { root, apply: (value, color) => fillBar(progress, value, color) };
}

function buildModern(icon, size) {
    const root = el("div", "hud-element hud-modern");
    const after = el("div", "after");
    after.appendChild(iconTag(icon));
    const box = iconBox(after, size);
    const background = el("div", "progress-background");
    const progress = el("div", "progress");
    background.appendChild(progress);
    root.append(box, background);
    return {
        root,
        apply(value, color) {
            box.style.color = color;
            fillBar(progress, value, color);
        }
    };
}

function buildCircle(icon, size) {
    const root = el("div", "hud-element hud-circle");
    const svg = svgEl("svg", { class: "circle-svg", viewBox: "0 0 468 468", fill: "none" });
    const back = svgEl("circle", { class: "circle-background", cx: 234, cy: 234, r: 234, fill: "transparent" });
    const progress = svgEl("circle", { class: "circle-progress", cx: 234, cy: 234, r: 234, fill: "transparent" });
    svg.append(svgEl("circle", { class: "backgroundFill", cx: 234, cy: 234, r: 189, fill: "#1A1A1A" }), back, progress);
    const box = iconBox(iconTag(icon), size);
    root.append(svg, box);
    let dash = 0;
    return {
        root, shaped: true,
        apply(value, color) {
            dash = dash || measure(progress);
            back.style.strokeDasharray = dash;
            applyStroke(progress, value, dash);
            progress.style.stroke = color;
            box.style.color = color;
        }
    };
}

function buildHexagon(icon, size) {
    const root = el("div", "hud-element hud-hexagon");
    const svg = svgEl("svg", { class: "hexagon-svg", viewBox: "0 0 390 390", fill: "none" });
    const progress = svgEl("path", { d: HEXAGON_OUTLINE, class: "stroke-animate", "stroke-width": 25 });
    const shape = svgEl("path", { d: HEXAGON_FILL });
    svg.append(svgEl("path", { d: HEXAGON_OUTLINE, stroke: "var(--primary-background)", "stroke-width": 25 }), progress, shape);
    root.append(svg, iconBox(iconTag(icon), size));
    let dash = 0;
    return {
        root, shaped: true,
        apply(value, color) {
            dash = dash || measure(progress);
            applyStroke(progress, value, dash);
            progress.setAttribute("stroke", color);
            shape.setAttribute("fill", color);
        }
    };
}

function maskId(icon) {
    maskSerial += 1;
    const base = icon ? icon.replace(/[^a-zA-Z0-9]/g, "") : "default";
    return `progressMask-${base}-${maskSerial}`;
}

function buildSquare(icon, size) {
    const root = el("div", "hud-element hud-square");
    const svg = svgEl("svg", { class: "square-svg", viewBox: "0 0 396 396", fill: "none" });
    const id = maskId(icon);
    const mask = svgEl("mask", { id });
    const window = svgEl("rect", { x: 0, width: SQUARE_SIDE, height: SQUARE_SIDE, fill: "white" });
    const stroke = svgEl("rect", { x: 18, y: 18, width: 360, height: 360, "stroke-width": 35, mask: `url(#${id})` });
    mask.appendChild(window);
    svg.append(svgEl("rect", { x: 50, y: 50, width: 296, height: 296, fill: "var(--primary-background)" }),
        svgEl("rect", { x: 18, y: 18, width: 360, height: 360, stroke: "var(--primary-background)", "stroke-width": 35 }),
        mask, stroke);
    const box = iconBox(iconTag(icon), size);
    root.append(svg, box);
    return { root, shaped: true, apply: (value, color) => cutSquare(window, stroke, box, value, color) };
}

// An unset value leaves the mask wide open, exactly as the build computed it.
function cutSquare(window, stroke, box, value, color) {
    const height = value ? value / 100 * SQUARE_SIDE : SQUARE_SIDE;
    window.setAttribute("y", SQUARE_SIDE - height);
    window.setAttribute("height", height);
    stroke.setAttribute("stroke", color);
    box.style.color = color;
}

export const VARIANTS = {
    basic: (icon, size) => buildFilled("basic", icon, size),
    skew: (icon, size) => buildFilled("skew", icon, size),
    diamond: (icon, size) => buildFilled("diamond", icon, size),
    modern: buildModern,
    circle: buildCircle,
    hexagon: buildHexagon,
    square: buildSquare
};

// Only the boxed variants bind smoothEdges and the in-game sizing class.
export function updateVariant(view, value, color, options, inGame) {
    setClasses(view.root, {
        iconShadow: options.iconShadow,
        smoothBorder: !view.shaped && options.smoothEdges,
        game: inGame && !view.shaped
    });
    view.apply(value, color);
}
