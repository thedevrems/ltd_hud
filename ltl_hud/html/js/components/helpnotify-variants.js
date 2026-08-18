import { el, clear, setText, setHTML, setClass, setClasses } from "../core/dom.js";

const DEFAULT_ICON = "fas fa-inbox";

const HEXAGON_SVG = '<svg viewBox="0 0 288 324" fill="none" xmlns="http://www.w3.org/2000/svg">' +
    '<path d="M129.5 4.37158C138.473 -0.808768 149.527 -0.808771 158.5 4.37158L273.26 70.6284C282.233 ' +
    '75.8088 287.76 85.3825 287.76 95.7432V228.257C287.76 238.618 282.233 248.191 273.26 253.372L158.5 ' +
    '319.628C149.527 324.809 138.473 324.809 129.5 319.628L14.7398 253.372C5.76715 248.191 0.239777 ' +
    '238.618 0.239777 228.257V95.7432C0.239777 85.3825 5.76715 75.8088 14.7398 70.6284L129.5 4.37158Z" ' +
    'fill="var(--primary-background)"></path></svg>';

const DIAMOND_SVG = '<svg viewBox="0 0 455 618" fill="none" xmlns="http://www.w3.org/2000/svg">' +
    '<rect x="155" y="149.789" width="211.834" height="211.83" rx="22" ' +
    'transform="rotate(-45 155 149.789)" fill="var(--primary-background)"></rect>' +
    '<rect y="309.789" width="211.834" height="211.83" rx="22" ' +
    'transform="rotate(-45 0 309.789)" fill="var(--primary-background)"></rect>' +
    '<rect x="155" y="467.789" width="211.834" height="211.83" rx="22" ' +
    'transform="rotate(-45 155 467.789)" fill="var(--primary-background)"></rect></svg>';

function imageIcon(src) {
    const box = el("div", "image-icon");
    box.appendChild(el("img", null, { src: src }));
    return box;
}

function keyBadge(key) {
    const badge = el("div", "key-icon");
    setText(badge, key);
    return badge;
}

// Object icons draw a key or an image; a string falls back to a Font Awesome tag.
function fillIcon(box, icon, badged) {
    clear(box);
    if (icon === null || typeof icon !== "object") {
        box.appendChild(el("i", icon === undefined ? DEFAULT_ICON : icon));
        return;
    }
    if (icon.type === "key") box.appendChild(badged ? keyBadge(icon.key) : document.createTextNode(icon.key));
    else if (icon.type === "image") box.appendChild(imageIcon(icon.src));
}

function buildStage() {
    const root = el("div", "stage");
    const text = el("div", "text");
    const done = el("div", "done");
    done.appendChild(el("i", "fas fa-check"));
    root.append(el("div", "dot"), text, done);
    return { root, text };
}

function createRegion() {
    const column = el("div", "column-text");
    const header = el("div", "header");
    const stages = el("div", "stages");
    const text = el("div", "text");
    column.append(header, stages, text);
    return { column, header, stages, text, rows: [] };
}

function show(node, visible) {
    node.style.display = visible ? "" : "none";
}

// Rows are patched in place so their opacity transitions keep playing.
function syncStages(region, list) {
    const entries = Object.values(list);
    while (region.rows.length > entries.length) region.rows.pop().root.remove();
    while (region.rows.length < entries.length) {
        const row = buildStage();
        region.rows.push(row);
        region.stages.appendChild(row.root);
    }
    entries.forEach((entry, index) => {
        setClasses(region.rows[index].root, { current: entry.active, complete: entry.complete });
        setHTML(region.rows[index].text, entry.text);
    });
}

// A table of stages renders the checklist, anything else a single line of text.
function updateRegion(region, data) {
    const listed = data.text !== null && typeof data.text === "object";
    setClass(region.column, "center", typeof data.text === "string");
    show(region.header, !!data.header);
    setText(region.header, data.header);
    show(region.stages, listed);
    show(region.text, !listed);
    if (listed) syncStages(region, data.text);
    else setHTML(region.text, data.text);
}

function buildBasic() {
    const root = el("div", "helpnotify-element helpnotify-basic");
    const icon = el("div", "icon");
    const content = el("div", "text-content");
    const region = createRegion();
    content.append(el("div", "line"), region.column);
    root.append(icon, content);
    return { root, icon, region, badged: true, rounded: true };
}

// Hexagon and diamond share one layout: a shaped backdrop behind the icon.
function buildShaped(name, svg) {
    const root = el("div", `helpnotify-element helpnotify-${name}`);
    const pre = el("div", "pre-icon");
    setHTML(pre, svg);
    const icon = el("div", "icon");
    pre.appendChild(icon);
    const content = el("div", "text-content");
    const region = createRegion();
    content.appendChild(region.column);
    root.append(pre, content);
    return { root, icon, region, badged: false, rounded: name === "hexagon" };
}

export const VARIANTS = {
    basic: buildBasic,
    hexagon: () => buildShaped("hexagon", HEXAGON_SVG),
    diamond: () => buildShaped("diamond", DIAMOND_SVG)
};

// Diamond never binds smoothEdges, so only the rounded variants react to it.
export function updateVariant(view, data, options) {
    setClasses(view.root, {
        background: options.background,
        smoothEdges: view.rounded && options.smoothEdges
    });
    fillIcon(view.icon, data.icon, view.badged);
    updateRegion(view.region, data);
}
