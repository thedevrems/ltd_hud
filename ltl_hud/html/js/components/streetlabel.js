import { minimap, setStreetLabelData, setStreetLabelVisibility } from "../core/minimapstore.js";
import { config } from "../core/config.js";
import { setClass, setText } from "../core/dom.js";

let host = null;
let direction = null;
let primary = null;
let secondary = null;
let time = null;
let distance = null;

// Waypoint distance keeps two decimals and follows the server metric system.
function distanceText(value) {
    const unit = config.state.Metrics === "mph" ? "mi" : "km";
    return Math.floor(value * 100) / 100 + unit;
}

function render() {
    if (!host) return;
    const label = minimap.state.streetlabel;
    setClass(host, "active", label.visible);
    setText(direction, label.direction);
    setText(primary, label.streets.primary);
    setText(secondary, label.streets.secondary);
    setClass(secondary, "active", label.streets.secondary);
    setText(time, label.time);
    setText(distance, distanceText(label.distance));
    setClass(distance, "active", label.distance > 0);
}

export function register(bus) {
    host = document.getElementById("street-label");
    direction = host.querySelector(".direction");
    primary = host.querySelector(".street > .street-primary");
    secondary = host.querySelector(".street > .street-secondary");
    time = host.querySelector(".col > .time");
    distance = host.querySelector(".col > .distance");
    bus.on("SET_STREETLABEL_DATA", data => setStreetLabelData(data));
    bus.on("SET_STREETLABEL_VISIBILITY", data => setStreetLabelVisibility(data.state));
    minimap.subscribe(render);
    config.subscribe(render);
    render();
}
