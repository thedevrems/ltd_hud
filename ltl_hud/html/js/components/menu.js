import { el, clear, setText, setClass } from "../core/dom.js";
import { menu, setIsVisible, onChange, setData, selectCurrent } from "../core/menustore.js";

let host = null;
let elements = null;
let mountedItems = null;
const nodes = [];

// Five slots orbit the current index; every other entry stays transparent.
function slotClass(index) {
    const total = menu.state.menuItems.length;
    const offset = (index - menu.state.currentItemIndex + total) % total;
    if (offset === 0) return "active";
    if (offset === 1) return "surrounding-bottom-1";
    if (offset === 2) return "surrounding-bottom-2";
    if (offset === total - 1) return "surrounding-top-1";
    if (offset === total - 2) return "surrounding-top-2";
    return "";
}

function buildElements() {
    mountedItems = menu.state.menuItems;
    nodes.length = 0;
    clear(elements);
    mountedItems.forEach(item => {
        const node = el("div", "element");
        setText(node, item.label);
        nodes.push(node);
        elements.appendChild(node);
    });
}

function applySlots() {
    nodes.forEach((node, index) => {
        node.className = ("element " + slotClass(index)).trim();
    });
}

function render() {
    if (menu.state.menuItems !== mountedItems) buildElements();
    applySlots();
    setClass(host, "active", menu.state.isVisible);
}

function registerHandlers(bus) {
    bus.on("SHOW_MENU", data => setIsVisible(data.state));
    bus.on("MENU_ON_CHANGE", data => onChange(data.isArrowUp));
    bus.on("SET_MENU_DATA", data => setData(data));
    bus.on("ON_MENU_SELECT", () => selectCurrent());
}

// The all-in-one wheel menu pinned to the right edge of the game screen.
export function register(bus) {
    host = document.getElementById("aio-menu");
    elements = host.querySelector(".elements");
    registerHandlers(bus);
    menu.subscribe(render);
    render();
}
