import {
    perspective, setWeaponIndicatorState, setWeaponIndicatorName, setWeaponIndicatorAmmo
} from "../core/perspectivestore.js";
import { config } from "../core/config.js";
import { language, ui } from "../core/i18n.js";
import { setClass, setText } from "../core/dom.js";

const panels = [];

// Both modes share one markup. The build hardcoded the 3d copy's label in the
// page; both now read the same translation key, so one edit relabels both.
function panel(hostId, gateId, fixedLabel) {
    const host = document.getElementById(hostId);
    return {
        host,
        gate: document.getElementById(gateId),
        fixedLabel,
        label: host.querySelector(".weapon-data > .label"),
        name: host.querySelector(".text-content > .name"),
        ammo: host.querySelector(".weapon-ammo > .ammo"),
        magazines: host.querySelector(".weapon-ammo > .magazines"),
        value: host.querySelector(".progress > .value")
    };
}

function paint(target, indicator) {
    setClass(target.host, "visible", indicator.use);
    setText(target.label, target.fixedLabel || ui("weapon_indicator.weapon"));
    setText(target.name, indicator.name);
    setText(target.ammo, indicator.ammo.current);
    setText(target.magazines, indicator.ammo.magazine);
    target.value.style.width = indicator.ammo.current / indicator.ammo.max * 100 + "%";
}

// The server picks one mode; the 2d panel also honours the master switch.
function applyMode() {
    const options = config.state.UI;
    panels[0].gate.style.display = options.WeaponIndicatorMode === "3d" ? "" : "none";
    const use2d = options.WeaponIndicatorMode === "non-3d" && options.UseWeaponIndicator;
    panels[1].gate.style.display = use2d ? "" : "none";
}

function render() {
    if (!panels.length) return;
    applyMode();
    panels.forEach(target => paint(target, perspective.state.weaponIndicator));
}

export function register(bus) {
    panels.push(panel("weapon-indicator-3d", "weapon-indicator-3d", null));
    panels.push(panel("weapon-indicator-2d", "weapon-indicator-2d-content", null));
    bus.on("SET_WEAPON_INDICATOR_AS_ACTIVE", data => setWeaponIndicatorState(data.state));
    bus.on("SET_WEAPON_INDICATOR_NAME", data => setWeaponIndicatorName(data.name));
    bus.on("SET_WEAPON_INDICATOR_AMMO", data => setWeaponIndicatorAmmo(data));
    perspective.subscribe(render);
    config.subscribe(render);
    language.subscribe(render);
    render();
}
