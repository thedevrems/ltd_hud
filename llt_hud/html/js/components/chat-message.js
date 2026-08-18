import { el, setText, setHTML } from "../core/dom.js";
import { config } from "../core/config.js";
import { post } from "../core/nui.js";

const ICON_PREFIXES = ["fas", "fa", "ph"];

// The build tints the chip with the message colour and picks a readable glyph.
function isNearBlack(color) {
    const red = parseInt(color.slice(1, 3), 16);
    const green = parseInt(color.slice(3, 5), 16);
    const blue = parseInt(color.slice(5, 7), 16);
    return Math.sqrt(red * red + green * green + blue * blue) <= 100;
}

function foreground(color) {
    if (color === "default") return "";
    return isNearBlack(color) ? "white" : "#1a1a1a";
}

function buildIcon(message) {
    const node = el("div", "icon");
    const tinted = message.color !== "default";
    if (tinted) node.style.backgroundColor = message.color;
    if (ICON_PREFIXES.some(prefix => message.icon.startsWith(prefix))) {
        const glyph = el("i", message.icon);
        glyph.style.color = foreground(message.color);
        node.appendChild(glyph);
        return node;
    }
    setText(node, message.icon);
    node.style.color = foreground(message.color);
    if (tinted) node.style.fontWeight = isNearBlack(message.color) ? "700" : "800";
    return node;
}

function tintedSpan(message, text) {
    const span = el("span");
    if (message.color !== "default") span.style.color = message.color;
    setText(span, text);
    return span;
}

function playerHeader(message) {
    if (!message.player.id && !message.player.name) return null;
    const node = el("div", "header");
    if (message.player.id) {
        node.appendChild(document.createTextNode(config.state.Chat.Translate.player_with_id + " "));
        node.appendChild(tintedSpan(message, "[" + message.player.id + "]"));
        return node;
    }
    node.appendChild(tintedSpan(message, message.player.name));
    return node;
}

// Server-provided headers are markup, anonymous senders fall back to a label.
function buildHeader(message) {
    if (message.player) return playerHeader(message);
    const node = el("div", "header");
    if (message.customHeader) setHTML(node, message.customHeader);
    else setText(node, config.state.Chat.Translate.anonymous);
    return node;
}

function buildButtons(message) {
    const wrapper = el("div", "buttons");
    Object.values(message.actionButtons).forEach(button => {
        const node = el("div", "button");
        const label = el("div", "text");
        setText(label, button.label);
        node.appendChild(label);
        node.addEventListener("click", () => post("chat.actionButton", {
            keyValue: message.keyValue,
            actionButton: button
        }));
        wrapper.appendChild(node);
    });
    return wrapper;
}

export function buildMessage(message) {
    const root = el("div", "message");
    const content = el("div", "text-content");
    const headerBox = el("div", "header-box");
    const header = buildHeader(message);
    if (header) headerBox.appendChild(header);
    const timestamp = el("div", "timestamp");
    setText(timestamp, message.time);
    headerBox.appendChild(timestamp);
    const text = el("div", "text");
    setText(text, message.message);
    content.append(headerBox, text);
    if (message.actionButtons) content.appendChild(buildButtons(message));
    root.append(buildIcon(message), content);
    return root;
}
