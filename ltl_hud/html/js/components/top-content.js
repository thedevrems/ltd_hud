import { el, setText, setClass } from "../core/dom.js";
import { topContent, setScreen, setActive } from "../core/topcontentstore.js";
import { voice } from "../core/voicestore.js";

const SIZES = { voice: { w: 12, h: 6.3 }, proximity: { w: 14, h: 6.7 } };
const SQUARE_COUNT = 14;
const SQUARE_INTERVAL = 100;

let host = null;
let talking = null;
let squares = [];
let proximity = null;
let label = null;
let gauge = null;

function buildTalking() {
    talking = el("div", "voice-talking");
    squares = [];
    for (let index = 0; index < SQUARE_COUNT; index++) {
        const column = el("div", "pre-squares");
        const square = el("div", "square");
        column.appendChild(square);
        talking.appendChild(column);
        squares.push(square);
    }
}

function buildProximity() {
    proximity = el("div", "proximity");
    label = el("div", "text");
    const progress = el("div", "progress");
    gauge = el("div", "value");
    progress.appendChild(gauge);
    proximity.append(label, progress);
}

// The bars keep dancing on their own timer; the build never stops the interval.
function shuffleSquares() {
    squares.forEach(square => {
        square.style.height = Math.floor(Math.random() * 10) / 10 + "vw";
    });
}

function applySize() {
    const size = SIZES[topContent.state.currentScreen];
    if (!size) return;
    host.style.width = size.w + "vw";
    host.style.height = size.h + "vw";
}

function render() {
    const screen = topContent.state.currentScreen;
    setClass(host, "visible", topContent.state.isActive);
    talking.style.display = screen === "voice" ? "" : "none";
    proximity.style.display = screen === "proximity" ? "" : "none";
    setText(label, voice.state.label);
    gauge.style.width = voice.state.value + "%";
}

export function register(bus) {
    host = document.getElementById("top-content");
    buildTalking();
    buildProximity();
    host.append(talking, proximity);
    shuffleSquares();
    setInterval(shuffleSquares, SQUARE_INTERVAL);
    bus.on("SET_TOP_CONTENT_SCREEN", data => setScreen(data.name));
    bus.on("SET_TOP_CONTENT_VISIBILITY", data => setActive(data.state));
    topContent.subscribe(() => { applySize(); render(); });
    voice.subscribe(render);
    render();
}
