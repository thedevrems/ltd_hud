import { minimap, setBaseData, setVisible } from "../core/minimapstore.js";

let host = null;

// The block tracks the game minimap rectangle reported by SET_RADAR_SIZE.
function applyPosition() {
    if (!host) return;
    const base = minimap.state.base;
    host.style.left = base.left_x + "%";
    host.style.bottom = `calc(100% - (${base.bottom_y + "%"}) + .75%)`;
    host.style.width = base.width + "%";
}

export function register(bus) {
    host = document.getElementById("minimap-data");
    bus.on("SET_RADAR_SIZE", data => setBaseData(data));
    bus.on("SET_RADAR_VISIBILITY", data => setVisible(data));
    minimap.subscribe(applyPosition);
    applyPosition();
}
