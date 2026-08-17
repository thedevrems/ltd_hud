import { el, svgEl, setText, setClasses } from "../core/dom.js";

const SVG_NS = "http://www.w3.org/2000/svg";
const RPM_RATIO = .51278;
const FUEL_RATIO = .55;

const RPM_BACKGROUND = "M99.382 811.578C58.0482 731.055 38.0663 641.274 41.3478 550.821C44.6292 460.369 71.0642 372.272 118.124 294.956C165.184 217.64 231.295 153.692 310.132 109.229C388.97 64.7658 477.898 41.2746 568.409 41.0024C658.92 40.7302 747.988 63.6861 827.091 107.674C906.195 151.663 972.689 215.212 1020.21 292.243C1067.74 369.274 1094.7 457.211 1098.53 547.642C1102.35 638.073 1082.91 727.973 1042.06 808.742L1042.02 808.719C1082.86 727.957 1102.3 638.066 1098.47 547.644C1094.65 457.222 1067.69 369.294 1020.17 292.271C972.649 215.247 906.161 151.704 827.066 107.721C747.97 63.7367 658.911 40.7831 568.409 41.0553C477.907 41.3275 388.988 64.8164 310.158 109.275C231.329 153.734 165.225 217.676 118.169 294.984C71.1141 372.292 44.6818 460.38 41.4007 550.823C38.1195 641.267 58.0994 731.039 99.4291 811.553L99.382 811.578Z";
const RPM_PROGRESS = "M124.043 854.541C74.0664 776.213 45.6014 686.104 41.5125 593.28C37.4236 500.457 57.855 408.193 100.751 325.774C143.647 243.355 207.493 173.688 285.867 123.783C364.24 73.8781 454.376 45.4955 547.203 41.4914C640.03 37.4874 732.275 58.0031 814.654 100.974C897.034 143.945 966.643 207.856 1016.48 286.275C1066.31 364.694 1094.61 454.855 1098.53 547.686C1102.45 640.517 1081.85 732.743 1038.8 815.083L1038.76 815.059C1081.8 732.726 1102.4 640.51 1098.48 547.688C1094.56 454.867 1066.26 364.715 1016.43 286.303C966.603 207.892 897.001 143.988 814.63 101.021C732.259 58.0543 640.023 37.5406 547.205 41.5443C454.387 45.548 364.261 73.9277 285.895 123.828C207.53 173.728 143.689 243.388 100.798 325.799C57.9062 408.21 37.4769 500.464 41.5654 593.278C45.6539 686.092 74.116 776.192 124.088 854.512L124.043 854.541Z";
const FUEL_BACKGROUND = "M167.692 913.496C217.277 971.571 278.848 1018.22 348.174 1050.24C417.5 1082.27 492.936 1098.9 569.3 1099C645.664 1099.1 721.144 1082.67 790.554 1050.83C859.965 1018.99 921.659 972.503 971.398 914.559L971.358 914.525C921.624 972.463 859.936 1018.95 790.532 1050.78C721.129 1082.62 645.656 1099.05 569.3 1098.95C492.944 1098.85 417.515 1082.21 348.196 1050.2C278.878 1018.18 217.313 971.531 167.732 913.461L167.692 913.496Z";
const FUEL_PROGRESS = "M139.416 877.308C188.939 946.697 254.497 1003.09 330.509 1041.68C406.52 1080.28 490.733 1099.93 575.976 1098.97C661.218 1098 744.966 1076.45 820.086 1036.15C895.206 995.851 959.474 937.992 1007.42 867.503L1007.37 867.473C959.435 937.955 895.174 995.809 820.061 1036.11C744.948 1076.4 661.209 1097.95 575.975 1098.91C490.741 1099.88 406.536 1080.23 330.533 1041.64C254.529 1003.05 188.977 946.659 139.459 877.278L139.416 877.308Z";
const CORNER = "M777.246 1208.21C855.148 1186.91 928.09 1150.46 991.909 1100.97C1055.73 1051.47 1109.17 989.89 1149.19 919.739L1149.16 919.724C1109.15 989.871 1055.7 1051.45 991.89 1100.94C928.075 1150.44 855.136 1186.88 777.238 1208.18L777.246 1208.21Z";

function iconBox(icon, className) {
    const box = el("div", className || "icon");
    box.appendChild(el("i", icon));
    return box;
}

// Speed always reads as three digits, the leading ones dimmed below 100.
function speedBox() {
    const root = el("div", "speed-box");
    const digits = [el("div", "speed"), el("div", "speed"), el("div", "speed")];
    root.append(...digits);
    return { root, digits };
}

function applySpeed(digits, speed) {
    const characters = String(speed).padStart(3, "0").split("");
    digits.forEach((digit, index) => setText(digit, characters[index]));
    digits[0].classList.toggle("speed-0", speed < 100);
    digits[1].classList.toggle("speed-0", speed < 10);
}

// The badge blinks while the belt is off and the warning is running.
function applySeatbelt(node, view) {
    setClasses(node, {
        active: view.useSeatbelt ? view.seatbelt : false,
        disabled: view.useSeatbelt === false,
        unfastenIndicate: view.useSeatbelt ? !view.seatbelt && view.unfastenSeatbelt : false
    });
}

// Dash length is only measurable once the arc has been laid out.
function measure(node) {
    if (!node.getTotalLength || !node.getClientRects().length) return 0;
    return node.getTotalLength();
}

// The arc is measured once, then only its dash offset follows the value.
function arcSetter(node, ratio) {
    let dash = 0;
    return value => {
        if (!dash) dash = measure(node);
        node.style.strokeDasharray = dash;
        node.style.strokeDashoffset = dash - dash * (value / 100 * ratio);
    };
}

function arcs() {
    const svg = svgEl("svg", { viewBox: "0 0 1140 1140", fill: "none", xmlns: SVG_NS });
    const rpm = svgEl("path", { class: "strokeProgress", d: RPM_PROGRESS });
    const fuel = svgEl("path", { class: "strokeProgress", d: FUEL_PROGRESS });
    const strokes = [
        svgEl("path", { class: "strokeBackground", d: RPM_BACKGROUND }), rpm,
        svgEl("path", { class: "strokeBackground", d: FUEL_BACKGROUND }), fuel
    ];
    svg.append(...strokes);
    svg.append(svgEl("path", { d: CORNER, fill: "#1A1A1A" }), svgEl("path", { d: CORNER, fill: "#EE1C3E" }));
    return { svg, strokes, setRpm: arcSetter(rpm, RPM_RATIO), setFuel: arcSetter(fuel, FUEL_RATIO) };
}

// Basic wraps the speed dial in two svg arcs for rpm and fuel.
function buildBasic() {
    const root = el("div", "carhud-element carhud-basic game-ratio");
    const arc = arcs();
    const content = el("div", "content");
    const speed = speedBox();
    const metrics = el("div", "metrics");
    const gear = el("div", "gear");
    const items = el("div", "items");
    const seatbelt = el("div", "item");
    const engine = el("div", "item");
    const engineFill = el("div", "progress");
    seatbelt.appendChild(iconBox("fas fa-user-slash"));
    engine.append(iconBox("fas fa-wrench"), engineFill);
    items.append(seatbelt, engine);
    content.append(speed.root, metrics, gear, iconBox("fas fa-gas-pump", "fuel-icon"), items);
    root.append(arc.svg, content);
    return { root, apply: view => applyBasic(view, { speed, metrics, gear, seatbelt, engineFill, arc }) };
}

function applyBasic(view, parts) {
    applySpeed(parts.speed.digits, view.speed);
    setText(parts.metrics, view.metrics);
    setText(parts.gear, view.gear);
    applySeatbelt(parts.seatbelt, view);
    parts.engineFill.style.height = view.engine + "%";
    parts.arc.strokes.forEach(node => node.style.setProperty("stroke-width", String(view.strokeWidth)));
    parts.arc.setRpm(view.rpm);
    parts.arc.setFuel(view.fuel);
}

function verticalGauge(className, icon) {
    const root = el("div", className);
    const fill = el("div", "progress");
    root.append(iconBox(icon), fill);
    return { root, fill };
}

// Default lines the readouts up in a row above a flat rpm bar.
function buildDefault() {
    const root = el("div", "carhud-element carhud-default game-ratio");
    const define = el("div", "carhud-define");
    const row = el("div", "row");
    const speed = speedBox();
    const metrics = el("div", "metrics");
    const box = el("div", "box-content");
    const items = el("div", "items");
    const seatbelt = el("div", "item seatbelt invert");
    const engine = verticalGauge("item engine", "fas fa-wrench");
    const fuel = verticalGauge("fuel", "fas fa-gas-pump");
    const gear = el("div", "gear");
    const rpm = el("div", "rpm");
    const rpmValue = el("div", "value");
    seatbelt.appendChild(iconBox("fas fa-user-slash"));
    items.append(seatbelt, engine.root);
    box.append(items, fuel.root, gear);
    row.append(speed.root, metrics, box);
    rpm.appendChild(rpmValue);
    define.append(row, rpm);
    root.appendChild(define);
    return { root, apply: view => applyDefault(view, { speed, metrics, gear, seatbelt, engine, fuel, rpmValue }) };
}

function applyDefault(view, parts) {
    applySpeed(parts.speed.digits, view.speed);
    setText(parts.metrics, view.metrics);
    setText(parts.gear, view.gear);
    applySeatbelt(parts.seatbelt, view);
    parts.engine.fill.style.height = view.engine + "%";
    parts.fuel.fill.style.height = view.fuel + "%";
    parts.rpmValue.style.width = view.rpm + "%";
}

export const VARIANTS = {
    basic: buildBasic,
    default: buildDefault
};
