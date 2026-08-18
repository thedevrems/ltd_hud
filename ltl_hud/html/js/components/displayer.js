import { el, clear, setText } from "../core/dom.js";
import { config } from "../core/config.js";
import { ui, language } from "../core/i18n.js";
import { player, setData, BASE_ORDER, inOrder } from "../core/playerstore.js";
import { formatCurrency } from "../core/format.js";
import { countTo } from "../core/counter.js";

// L'UUID de ltl_core fait quatre caractères [a-z0-9]. La puce garde la mise en
// forme d'origine — un « # » collé à des cases de largeur fixe — mais plus rien
// n'est complété par des zéros : c'était bon pour un identifiant serveur
// numérique, ça n'a aucun sens pour un code alphanumérique.
const UUID_LENGTH = 4;
const UUID_FILLER = "·";

// « Petite frappe » écrit son propre intitulé dans `text` — « Petite frappe :
// Non » — hérité de la puce d'avant, qui n'en avait pas au-dessus d'elle. Sous un
// intitulé, elle le dirait deux fois : c'est `grade`, « Oui » ou « Non », que
// cette disposition affiche. Le métier et le gang n'ont pas ce problème, leur
// texte est déjà la valeur seule.
const GRADE_ONLY = { thug: true };

let host = null;
let identityRow = null;
let walletRow = null;
let addonRow = null;
const walletValues = {};

function visible() {
    return (config.state.Displayer && config.state.Displayer.Visible) || {};
}

// L'intitulé d'une ligne vient de la traduction, jamais de la charge utile. Le
// serveur y envoie bien un `label`, mais ce champ désigne deux choses selon la
// ligne — le NOM DU MÉTIER pour `job`, le NOM DU CHAMP pour un portefeuille — et
// le reprendre afficherait « Mécanicien » comme intitulé du métier. Une ligne
// qu'un serveur ajoute se nomme donc en ajoutant sa clé à
// Translations.UI.displayer, comme pour le menu pause ; sans elle, la valeur
// s'affiche seule, ce que faisait déjà la puce d'avant.
function labelFor(key) {
    return ui("displayer." + key);
}

// La seule règle de couleur du bandeau, et elle tient en deux tons : ce qui ne
// dit rien s'estompe, ce qui porte un fait légal passe en ambre. Un gang nommé
// n'est ni l'un ni l'autre — c'est une information neutre, elle reste blanche.
function toneFor(key, entry) {
    // Le gang `none` de ltl_core est un gang comme un autre, libellé « Aucun » :
    // c'est son nom qui le désigne, pas son texte, qui est traduit et qu'un
    // serveur peut réécrire.
    if (key === "gang") return entry.name === "none" ? "quiet" : "";
    if (key === "thug") return entry.value === true ? "flag" : "quiet";
    return "";
}

// Seul l'argent sale porte un ton : zéro ne dit rien, une somme est un fait
// légal. Un liquide à zéro reste blanc — c'est une valeur, pas une absence.
function walletTone(key, amount) {
    if (key !== "black") return "";
    return Number(amount) > 0 ? "flag" : "quiet";
}

function fieldNode(key, value, tone) {
    const field = el("div", "field field-" + key);
    const name = labelFor(key);
    if (name) {
        const label = el("div", "label");
        setText(label, name);
        field.appendChild(label);
    }
    const box = el("div", "value");
    if (tone) box.dataset.tone = tone;
    setText(box, value);
    field.appendChild(box);
    return field;
}

// L'UUID est rendu caractère par caractère, comme l'était l'identifiant, pour
// garder l'espacement fixe de la puce. Les cases de remplissage — celles d'un
// UUID plus court que prévu, ou absent tant que SET_PLAYER_DATA n'est pas arrivé
// — sont estompées, comme l'étaient les zéros de tête.
function idNode() {
    const field = el("div", "field field-id");
    const name = labelFor("id");
    if (name) {
        const label = el("div", "label");
        setText(label, name);
        field.appendChild(label);
    }

    const box = el("div", "value");
    const hash = el("span", "hash");
    hash.textContent = "#";
    const digits = el("span", "digits");
    const uuid = String(player.state.user.uuid || "").trim().padStart(UUID_LENGTH, UUID_FILLER);
    uuid.split("").forEach(character => {
        const cell = el("span", character === UUID_FILLER ? "zero" : "non-zero");
        cell.textContent = character;
        digits.appendChild(cell);
    });
    box.append(hash, digits);
    field.appendChild(box);
    return field;
}

// Une rangée vide se retire au lieu de laisser son écart : sans surface, un vide
// entre deux rangées ne se lit pas comme une rangée absente, il se lit comme un
// alignement raté.
function showRow(row) {
    row.style.display = row.children.length ? "" : "none";
}

function build() {
    const rule = el("span", "rule");
    rule.setAttribute("aria-hidden", "true");
    identityRow = el("div", "row");
    walletRow = el("div", "row");
    addonRow = el("div", "row");
    const body = el("div", "body");
    body.append(identityRow, walletRow, addonRow);
    host.append(rule, body);
}

function valueOf(key, entry) {
    return GRADE_ONLY[key] && entry.grade ? entry.grade : entry.text;
}

// `jobs` gouverne la rangée entière ; un interrupteur portant le nom d'une ligne
// (`gang`, `thug`) ne gouverne que celle-là. Une ligne que rien ne nomme suit
// `jobs`, si bien qu'ajouter une ligne côté serveur l'affiche sans toucher ici.
function renderIdentity() {
    clear(identityRow);
    if (visible().id) identityRow.appendChild(idNode());
    if (visible().jobs) {
        const base = player.state.user.base || {};
        inOrder(base, BASE_ORDER).forEach(key => {
            if (visible()[key] === false) return;
            const entry = base[key];
            identityRow.appendChild(fieldNode(key, valueOf(key, entry), toneFor(key, entry)));
        });
    }
    showRow(identityRow);
}

function renderWallets() {
    clear(walletRow);
    if (visible().wallets) {
        const wallets = player.state.user.wallets || {};
        for (const key in wallets) {
            const amount = walletValues[key] === undefined ? wallets[key].text : walletValues[key];
            // Le ton se juge sur le total et non sur la valeur en cours
            // d'animation : sinon l'argent sale clignoterait de l'estompé à
            // l'ambre pendant le décompte.
            walletRow.appendChild(fieldNode(key, currency(amount), walletTone(key, wallets[key].text)));
        }
    }
    showRow(walletRow);
}

function renderAddon() {
    clear(addonRow);
    const addon = player.state.user.addon;
    if (addon && visible().addon) {
        for (const key in addon) addonRow.appendChild(fieldNode(key, addon[key].text, ""));
    }
    showRow(addonRow);
}

function currency(value) {
    return formatCurrency(value, config.state.Currency, {
        removeDecimals: !!config.state.UI.RemoveDecimalsFromWallets
    });
}

function render() {
    renderIdentity();
    renderWallets();
    renderAddon();

    // Le bloc entier se retire quand il ne reste rien à dire, et pas seulement
    // quand Config.Displayer.Use l'éteint : un filet de 2 px sans hauteur ne se
    // voit pas, mais son écart avec le logo se voit, et le logo se retrouverait
    // décalé du bord sans que rien n'explique pourquoi.
    const used = !!(config.state.Displayer && config.state.Displayer.Use);
    const filled = [identityRow, walletRow, addonRow].some(row => row.children.length);
    host.style.display = used && filled ? "" : "none";
}

// Wallet changes count up over twenty frames instead of snapping to the total.
function animateWallets() {
    const wallets = player.state.user.wallets || {};
    for (const key in wallets) {
        const from = walletValues[key];
        const to = wallets[key].text;
        if (from === undefined) { walletValues[key] = to; continue; }
        countTo(from, to, value => { walletValues[key] = value; renderWallets(); });
    }
}

function onPlayerChanged() {
    animateWallets();
    render();
}

export function register(bus) {
    host = document.getElementById("player-displayer");
    build();
    bus.on("SET_PLAYER_DATA", data => setData(data));
    player.subscribe(onPlayerChanged);
    config.subscribe(render);
    // Les intitulés portent maintenant le sens de chaque valeur, et ils viennent
    // de LOAD_UP_TRANSLATIONS. Sans cet abonnement, un bandeau monté avant ce
    // message resterait sur des valeurs nues jusqu'au prochain SET_PLAYER_DATA.
    language.subscribe(render);
    render();
}
