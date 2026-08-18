import { el, clear, animate } from "../core/dom.js";
import { welcome } from "../core/welcomestore.js";

const GRID = 10;
const CELLS = GRID * GRID;
const EASING = "cubic-bezier(0.075, 0.82, 0.165, 1)";
const DURATION = 250;
const ENTER_STEP = 110;
const LEAVE_STEP = 90;

let root = null;
let cells = [];
let visible = false;

// anime.stagger(grid, from "center"): the delay follows the distance to the middle.
function delayOf(index, step) {
    const centre = (GRID - 1) / 2;
    const distanceX = centre - index % GRID;
    const distanceY = centre - Math.floor(index / GRID);
    const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);
    return step * (Math.round(distance * 100) / 100);
}

function build() {
    const content = el("div", "stagger-content");
    cells = [];
    for (let index = 0; index < CELLS; index++) {
        const cell = el("div", "stagger");
        const tile = el("div", "stagger-style");
        cell.appendChild(tile);
        content.appendChild(cell);
        cells.push(tile);
    }
    return content;
}

function scaleCells(from, to, step) {
    let longest = 0;
    cells.forEach((tile, index) => {
        const delay = delayOf(index, step);
        longest = Math.max(longest, delay);
        animate(tile, { transform: [`scale(${from})`, `scale(${to})`] }, { duration: DURATION, delay, easing: EASING });
    });
    return longest + DURATION;
}

function show() {
    clear(root);
    root.appendChild(build());
    scaleCells(0, 1, ENTER_STEP);
}

// The overlay is dropped only once the last tile finished shrinking.
function hide() {
    const total = scaleCells(1, 0, LEAVE_STEP);
    setTimeout(() => { if (!visible) clear(root); }, total);
}

function applyVisibility() {
    const state = welcome.state.staggerTransition;
    if (visible === state) return;
    visible = state;
    if (state) return show();
    hide();
}

// The black tile grid that masks every camera switch of the welcome flow.
export function register() {
    root = document.getElementById("stagger-root");
    welcome.subscribe(applyVisibility);
}
