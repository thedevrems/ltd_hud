import { createStore } from "./state.js";

const REVEAL_DELAY = 125;
const HIDE_DELAY = 480;
const AUTO_DISMISS = 10000;

export const minimap = createStore("minimap", {
    base: {
        width: 14, height: 17.6, left_x: 3.4, bottom_y: 96.5,
        right_x: 17, top_y: 78, x: 3.4, y: 78.87, xunit: 0, yunit: 0
    },
    streetlabel: {
        direction: "NE",
        streets: { primary: "Mission Row", secondary: "Alta St." },
        time: "12:06",
        visible: false
    },
    default_notifies: { list: {} },
    isVisible: false
});

export function setBaseData(data) {
    minimap.state.base = data;
    minimap.emit();
}

export function setVisible(data) {
    minimap.state.isVisible = data.state;
    minimap.emit();
}

export function setStreetLabelVisibility(state) {
    minimap.state.streetlabel.visible = state;
    minimap.emit();
}

export function setStreetLabelData(data) {
    const label = minimap.state.streetlabel;
    label.direction = data.direction;
    label.streets = data.streets;
    label.time = data.time;
    label.distance = data.distance;
    minimap.emit();
}

// Notifies fade in shortly after mount and, unless persistent, expire on their own.
export function addNotify(data) {
    const list = minimap.state.default_notifies.list;
    list[data.serial] = data;
    minimap.emit();
    setTimeout(() => {
        if (!list[data.serial]) return;
        list[data.serial].visible = true;
        minimap.emit();
    }, REVEAL_DELAY);
    if (data.persistent) return;
    setTimeout(() => removeNotify(data), AUTO_DISMISS);
}

export function removeNotify(data) {
    const list = minimap.state.default_notifies.list;
    if (!list[data.serial]) return;
    list[data.serial].visible = false;
    minimap.emit();
    setTimeout(() => {
        delete list[data.serial];
        minimap.emit();
    }, HIDE_DELAY);
}

export function updateNotify(data) {
    const entry = minimap.state.default_notifies.list[data.serial];
    if (!entry) return;
    entry.text = data.text;
    minimap.emit();
}

export function updateNotifyProgress(data) {
    const entry = minimap.state.default_notifies.list[data.serial];
    if (!entry || !entry.progress) return;
    entry.progress.value = data.value;
    minimap.emit();
}
