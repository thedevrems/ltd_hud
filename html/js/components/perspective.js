import {
    perspective, setStatusValue, setStatusVisibility, setRotationOffset, setInVeh, setVisible
} from "../core/perspectivestore.js";
import { config } from "../core/config.js";
import { setClass } from "../core/dom.js";

let host = null;
let keybinds = null;
let content = null;
let hold = null;
let preRow = null;
const statusNodes = {};

// The keybind column mirrors the Y offset; the content column keeps it as is.
function rotation(invertY) {
    const offsets = perspective.state.rotationOffsets;
    const y = invertY ? 0 - offsets.y : offsets.y;
    return `rotateX(${offsets.x}deg) rotateY(${y}deg) rotateZ(${offsets.z}deg)`;
}

function renderStatuses() {
    const status = perspective.state.status;
    for (const key in statusNodes) {
        setClass(statusNodes[key].root, "visible", status[key].visible);
        statusNodes[key].value.style.width = status[key].value + "%";
    }
}

function render() {
    if (!host) return;
    host.style.display = config.state.UI.Use3DContent ? "flex" : "none";
    setClass(host, "inVeh", perspective.state.inVeh);
    setClass(host, "aiming", perspective.state.weaponIndicator.use);
    keybinds.style.transform = `${rotation(true)} translate3d( 0, 0, 0)`;
    content.style.transform = rotation(false);
    setClass(hold, "visible", perspective.state.isVisible);
    preRow.style.display = config.state.UI.Use3DVoiceIndicator ? "" : "none";
    renderStatuses();
}

// Sprint and oxygen are the two fixed rows the build hardcodes in the column.
function collectStatuses() {
    ["sprint", "oxygen"].forEach(key => {
        const root = document.getElementById("status-" + key);
        statusNodes[key] = { root, value: root.querySelector(".value") };
    });
}

export function register(bus) {
    host = document.getElementById("perspective-handler");
    keybinds = document.getElementById("keybinds-content");
    content = document.getElementById("perspective-content");
    hold = document.getElementById("hold-wrapper");
    preRow = document.getElementById("perspective-pre-row");
    collectStatuses();
    bus.on("SET_STATUS_VALUE", data => setStatusValue(data.key, data.value));
    bus.on("SET_STATUS_VISIBILITY", data => setStatusVisibility(data.key, data.state));
    bus.on("SET_PERSPECTIVE_CONTENT_VISIBILITY", data => setVisible(data.state));
    bus.on("SET_PERSPECTIVE_IN_VEH", data => setInVeh(data.state));
    bus.on("UPDATE_ROTATIONS", data => setRotationOffset(data.offsets));
    perspective.subscribe(render);
    config.subscribe(render);
    render();
}
