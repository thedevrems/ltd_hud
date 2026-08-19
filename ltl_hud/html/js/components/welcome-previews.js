import { el, setClass } from "../core/dom.js";
import { game } from "../core/gamestore.js";
import { ui } from "../core/i18n.js";
import { VARIANTS as HUD, updateVariant as updateHud } from "./hud-variants.js";
import { VARIANTS as CARHUD } from "./carhud-variants.js";
import { VARIANTS as NOTIFY } from "./notify-variants.js";
import { VARIANTS as HELPNOTIFY, updateVariant as updateHelpNotify } from "./helpnotify-variants.js";
import { VARIANTS as PROGRESSBAR } from "./progressbar-variants.js";

// Les deux ombres portées de l'aperçu central, écrites EN LIGNE par previewBox.
//
// Elles ont été refaites avec la charte : `drop-shadow(0 0 5px #1a1a1a)`
// détachait l'aperçu d'un fond BLANC, et sur le presque-noir de la charte une
// ombre noire de cinq pixels ne détache plus rien. La valeur de repli, pour les
// aperçus qui n'en reçoivent pas, est dans .customization-content .pre-ui
// (welcome-customize.css) : les trois doivent rester d'accord.
const SOFT = "drop-shadow(0 18px 34px rgba(0, 0, 0, .75))";
const STRONG = "drop-shadow(0 22px 44px rgba(0, 0, 0, .85))";
const HUD_ICON = "fas fa-heart";
const HUD_ICON_SIZE = "3vw";
const HUD_VALUE = 75;
const CARHUD_VALUES = { speed: 90, rpm: 80, fuel: 40, gear: 3, engine: 100, metrics: "kmh" };

const BOXES = {
    hud: () => ({ width: "8vw", height: "8vw" }),
    carhud: selected => selected === "basic"
        ? { width: "17.5vw", height: "17.5vw", filter: STRONG }
        : { width: "20vw", height: "15vw", filter: SOFT },
    notifications: () => ({ width: "22.5vw", height: "15vw", filter: SOFT }),
    helpNotify: selected => selected === "hexagon"
        ? { width: "22.5vw", filter: SOFT }
        : { width: "22.5vw", height: "15vw", filter: SOFT },
    progressBar: selected => selected === "diamond" ? { height: "15vw", filter: SOFT } : { filter: SOFT }
};

function testData(group) {
    return {
        header: ui("test_components." + group + ".header"),
        text: ui("test_components." + group + ".text"),
        icon: ui("test_components." + group + ".icon")
    };
}

function buildHud(selected) {
    const build = HUD[selected];
    return build ? build(HUD_ICON, HUD_ICON_SIZE) : null;
}

// The dial keeps the welcome ratio and reads the demo values the build hardcoded.
function buildCarHud(selected) {
    const build = CARHUD[selected];
    if (!build) return null;
    const view = build(false);
    view.root.classList.add("welcome-ratio");
    return view;
}

function buildNotify(selected) {
    const build = NOTIFY[selected];
    if (!build) return null;
    return { root: build(Object.assign({ duration: -1 }, testData("notification")), game.state.notifies.options) };
}

function buildHelpNotify(selected) {
    const build = HELPNOTIFY[selected];
    if (!build) return null;
    const view = build();
    view.root.classList.add("customize");
    return view;
}

function buildProgressBar(selected) {
    const build = PROGRESSBAR[selected];
    if (!build) return null;
    const view = build({ icon: ui("test_components.progress_bar.icon"), text: ui("test_components.progress_bar.text") });
    view.root.classList.add("isMenu");
    return view;
}

export const PREVIEWS = {
    hud: {
        build: buildHud,
        update: (view, slot) => updateHud(view, HUD_VALUE, game.state.color.primaryColor, slot.options, false)
    },
    carhud: {
        build: buildCarHud,
        update: (view, slot) => view.apply(Object.assign({}, CARHUD_VALUES, { strokeWidth: slot.options.strokeWidth }))
    },
    notifications: {
        build: buildNotify,
        update: (view, slot) => setClass(view.root, "smoothEdges", slot.options.smoothEdges)
    },
    helpNotify: {
        build: buildHelpNotify,
        update: (view, slot) => updateHelpNotify(view, testData("help_notify"), slot.options)
    },
    progressBar: { build: buildProgressBar }
};

// The box around a preview is sized per variant, as the render function was.
export function previewBox(element, selected) {
    const box = el("div", "pre-ui");
    const styles = BOXES[element](selected);
    for (const key in styles) box.style.setProperty(key, styles[key]);
    return box;
}
