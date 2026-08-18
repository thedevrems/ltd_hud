import { el, setText, setHTML } from "../core/dom.js";
import { config } from "../core/config.js";
import { ui } from "../core/i18n.js";
import { post } from "../core/nui.js";

const ICON_PREFIXES = ["fas", "fa", "ph"];

// Les couleurs `^0`..`^9` et `~r~` du jeu. Ce ne sont pas des choix de style :
// c'est un vocabulaire que partage chaque ressource FiveM, et `^1` doit rester
// rouge partout. Posées en style en ligne plutôt qu'en classes, pour n'ajouter
// aucune règle à la feuille du tchat.
const GAME_COLORS = {
    "^0": "#ffffff", "^1": "#ff4444", "^2": "#99cc00", "^3": "#ffbb33", "^4": "#0099cc",
    "^5": "#33b5e5", "^6": "#aa66cc", "^7": null, "^8": "#cc0000", "^9": "#cc0068",
    "~w~": "#ffffff", "~r~": "#ff4444", "~g~": "#99cc00", "~y~": "#ffbb33", "~b~": "#33b5e5"
};

const COLOR_CODE = /(\^[0-9]|\^#[0-9A-Fa-f]{3,6}|~[a-z]~)/;
const HEX = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

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
    // Une ressource peut appeler l'export sans puce : sans ce repli, `startsWith`
    // sur `undefined` faisait tomber tout le rendu du message.
    const icon = typeof message.icon === "string" ? message.icon : "";
    if (ICON_PREFIXES.some(prefix => icon.startsWith(prefix))) {
        const glyph = el("i", icon);
        glyph.style.color = foreground(message.color);
        node.appendChild(glyph);
        return node;
    }
    setText(node, icon);
    node.style.color = foreground(message.color);
    if (tinted) node.style.fontWeight = isNearBlack(message.color) ? "700" : "800";
    return node;
}

// Découpe sur les codes couleur du jeu et peint ce qui suit chacun. `split` avec
// un groupe capturant garde les délimiteurs, donc une seule passe donne le texte
// et les codes en alternance.
//
// Un code change la couleur de TOUT ce qui suit jusqu'au code suivant — c'est la
// règle du jeu, et les ressources s'appuient dessus. Un `^#zzz` invalide ne pose
// rien : une valeur impossible affectée à `style.color` est rejetée par le
// navigateur plutôt que gardée, ce qui est l'échec qu'on veut.
function paint(text, into) {
    const value = String(text == null ? "" : text);

    if (!COLOR_CODE.test(value)) {
        setText(into, value);
        return;
    }

    let color = null;

    value.split(COLOR_CODE).forEach(part => {
        if (!part) return;

        if (Object.prototype.hasOwnProperty.call(GAME_COLORS, part)) {
            color = GAME_COLORS[part];
            return;
        }
        if (part.startsWith("^#")) {
            const hex = part.slice(1);
            color = HEX.test(hex) ? hex : null;
            return;
        }

        const chunk = el("span");
        setText(chunk, part);
        if (color) chunk.style.color = color;
        into.appendChild(chunk);
    });
}

function tintedSpan(message, text) {
    const span = el("span");
    if (message.color !== "default") span.style.color = message.color;
    // Le triplet rgb hérité de `chatMessage` ne colore que l'auteur.
    if (message.authorColor) span.style.color = message.authorColor;
    setText(span, text);
    return span;
}

// La pastille de service, écrite en UN seul endroit. Elle est peinte deux fois —
// à la construction de la ligne, puis à chaque prise ou fin de service — et deux
// copies de « quelle couleur va avec quel mot », c'est exactement comme une
// pastille finit verte en lisant « pas en service ».
export function paintDuty(pill, onDuty) {
    pill.style.color = onDuty ? "#3fb27f" : "rgba(255, 255, 255, .45)";
    setText(pill, "[" + ui(onDuty ? "chat.on_duty" : "chat.off_duty") + "]");
}

// `[grade | libellé] Nom [en service]`, dans l'en-tête que le message dessine
// déjà. Aucune surface nouvelle : la ligne staff emprunte la mise en page
// existante, elle ne la remplace pas.
function staffHeader(message) {
    const staff = message.staff || {};
    // Les trois parties sont espacées par la feuille de style et non par des
    // espaces écrites dans le texte : un écart se règle, une espace non.
    const node = el("div", "header staff");

    const rank = el("span", "rank");
    setText(rank, "[" + (staff.rankId || "?") + " | " + (staff.rankLabel || "?") + "]");
    // Vient de la table des grades, posée par un administrateur et non par un
    // joueur — validée quand même, parce qu'une couleur reste une valeur que
    // cette page tend au moteur de style.
    if (typeof staff.rankColor === "string" && HEX.test(staff.rankColor)) {
        rank.style.color = staff.rankColor;
    }
    node.appendChild(rank);

    const who = el("span", "who");
    setText(who, staff.name || "?");
    node.appendChild(who);

    // LA PASTILLE N'EXISTE QUE SI LE SERVICE EST CONNU. Écrire « pas en service »
    // pour un état qu'on ignore serait exactement la confusion que la pastille
    // existe pour lever — voir Chat.DutyOf, côté serveur.
    if (typeof staff.onDuty === "boolean") {
        const pill = el("span", "duty");
        paintDuty(pill, staff.onDuty);
        node.appendChild(pill);
    }

    return node;
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
    if (message.staff) return staffHeader(message);
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
    if (message.staff && typeof message.staff.uuid === "string") {
        // La poignée à laquelle un changement de service sera rattaché. Uuid
        // public, jamais une licence.
        root.dataset.staff = message.staff.uuid;
    }
    const content = el("div", "text-content");
    const headerBox = el("div", "header-box");
    const header = buildHeader(message);
    if (header) headerBox.appendChild(header);
    const timestamp = el("div", "timestamp");
    setText(timestamp, message.time);
    headerBox.appendChild(timestamp);
    const text = el("div", "text");
    paint(message.message, text);
    content.append(headerBox, text);
    if (message.actionButtons) content.appendChild(buildButtons(message));
    root.append(buildIcon(message), content);
    return root;
}
