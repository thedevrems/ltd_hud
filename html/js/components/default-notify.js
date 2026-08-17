import { el, clear, setText, setHTML, setClass } from "../core/dom.js";
import { transformUsingRegex } from "../core/format.js";
import {
    minimap, addNotify, removeNotify, updateNotify, updateNotifyProgress
} from "../core/minimapstore.js";

let host = null;

function objectHeader(header) {
    const text = el("div", "text");
    setText(text, header.text);
    const icon = el("div", "icon");
    icon.style.color = header.color;
    icon.appendChild(el("i", header.icon));
    return [text, icon];
}

// The header accepts an object, a FontAwesome class, an image URL or plain text.
function buildHeader(header) {
    const node = el("div", "header");
    if (typeof header === "object" && header && header.text) {
        node.append(...objectHeader(header));
    } else if (typeof header === "string" && header.includes("fa-")) {
        const icon = el("div", "icon");
        icon.appendChild(el("i", header));
        node.appendChild(icon);
    } else if (typeof header === "string" && header.includes("https://")) {
        const box = el("div", "icon-img");
        box.appendChild(el("img", null, { src: header }));
        node.appendChild(box);
    } else {
        setText(node, header);
    }
    return node;
}

function buildBody(entry) {
    if (entry.progress) {
        const wrapper = el("div", "progress");
        const value = el("div", "value");
        value.style.width = entry.progress.value + "%";
        wrapper.appendChild(value);
        return wrapper;
    }
    if (!entry.text) return null;
    const text = el("div", "text");
    setHTML(text, transformUsingRegex(entry.text));
    return text;
}

function buildEntry(entry) {
    const node = el("div", "notify");
    setClass(node, "active", entry.visible);
    node.appendChild(buildHeader(entry.header));
    const body = buildBody(entry);
    if (body) node.appendChild(body);
    return node;
}

function render() {
    if (!host) return;
    clear(host);
    Object.values(minimap.state.default_notifies.list).forEach(entry => {
        host.appendChild(buildEntry(entry));
    });
}

export function register(bus) {
    host = document.getElementById("default-notifies");
    bus.on("ADD_DEFAULT_NOTIFIES", data => addNotify(Object.assign({}, data, { id: Date.now() })));
    bus.on("REMOVE_DEFAULT_NOTIFY", data => removeNotify(data));
    bus.on("UPDATE_DEFAULT_NOTIFY", data => updateNotify(data));
    bus.on("UPDATE_DEFAULT_NOTIFY_PROGRESS", data => updateNotifyProgress(data));
    minimap.subscribe(render);
    render();
}
