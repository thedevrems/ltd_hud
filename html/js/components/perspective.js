import { perspective } from "../core/perspectivestore.js";
import { config } from "../core/config.js";
import { setClass } from "../core/dom.js";

let host = null;
let keybinds = null;

// The keybind column mirrors the Y offset; the content column keeps it as is.
function rotation(invertY) {
    const offsets = perspective.state.rotationOffsets;
    const y = invertY ? 0 - offsets.y : offsets.y;
    return `rotateX(${offsets.x}deg) rotateY(${y}deg) rotateZ(${offsets.z}deg)`;
}

function render() {
    if (!host) return;
    host.style.display = config.state.UI.Use3DContent ? "flex" : "none";
    setClass(host, "inVeh", perspective.state.inVeh);
    setClass(host, "aiming", perspective.state.weaponIndicator.use);
    keybinds.style.transform = `${rotation(true)} translate3d( 0, 0, 0)`;
}

export function register() {
    host = document.getElementById("perspective-handler");
    keybinds = document.getElementById("keybinds-content");
    perspective.subscribe(render);
    config.subscribe(render);
    render();
}
