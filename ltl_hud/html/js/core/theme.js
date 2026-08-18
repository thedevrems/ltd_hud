import { convertHexToRGBA } from "./format.js";

// Les variables css que la couleur du joueur alimente, en un seul endroit.
//
// Le bandeau d'informations n'a plus de surface : il pose ses valeurs à même la
// scène, si bien que tout ce qu'il colore — le « # » de l'identifiant, l'intitulé
// de l'identifiant, le filet d'accent — vient de la couleur primaire du menu
// réglages. Il lui faut donc des teintes DÉRIVÉES de cette couleur, et le cef
// embarqué ne sait pas les calculer : il a plusieurs versions de retard, ne
// connaît pas color-mix(), et une déclaration qu'il ne comprend pas n'est pas
// approximée — elle est ignorée, sans erreur ni trace. Le calcul se fait donc
// ici, et arrive au css en canaux séparés pour que rgba() puisse les reprendre.

// L'accent, c'est la primaire éclaircie : même teinte, saturation tenue à un
// plancher, clarté fixe. Les deux valeurs viennent des cinq thèmes de test/, qui
// donnent chacun leur accent à la main — violet #8B5CF6 -> #C4B5FD, rouge
// #ee1c3e -> #FFB3C0, cyan #22D3EE -> #A5F3FC. Tous tombent autour de 83 % de
// clarté, et aucun ne laisse la saturation descendre sous 70 % : en dessous,
// l'accent vire au gris et l'intitulé de l'identifiant cesse de se distinguer
// des autres.
const ACCENT_LIGHTNESS = .83;
const ACCENT_FLOOR_SATURATION = .70;

const HEX = /^#?([0-9a-f]{6})$/i;

function channels(hex) {
    const match = HEX.exec(String(hex == null ? "" : hex).trim());
    if (!match) return null;
    const value = parseInt(match[1], 16);
    return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

function toHsl(rgb) {
    const red = rgb[0] / 255, green = rgb[1] / 255, blue = rgb[2] / 255;
    const high = Math.max(red, green, blue);
    const low = Math.min(red, green, blue);
    const light = (high + low) / 2;
    if (high === low) return { hue: 0, saturation: 0, light };

    const span = high - low;
    const saturation = light > .5 ? span / (2 - high - low) : span / (high + low);
    let hue;
    if (high === red) hue = (green - blue) / span + (green < blue ? 6 : 0);
    else if (high === green) hue = (blue - red) / span + 2;
    else hue = (red - green) / span + 4;
    return { hue: hue / 6, saturation, light };
}

function channelFor(dark, light, position) {
    let point = position;
    if (point < 0) point += 1;
    if (point > 1) point -= 1;
    if (point < 1 / 6) return dark + (light - dark) * 6 * point;
    if (point < 1 / 2) return light;
    if (point < 2 / 3) return dark + (light - dark) * (2 / 3 - point) * 6;
    return dark;
}

function fromHsl(hue, saturation, light) {
    if (saturation === 0) {
        const grey = Math.round(light * 255);
        return [grey, grey, grey];
    }
    const high = light < .5 ? light * (1 + saturation) : light + saturation - light * saturation;
    const low = 2 * light - high;
    return [hue + 1 / 3, hue, hue - 1 / 3].map(position =>
        Math.round(channelFor(low, high, position) * 255));
}

// Une primaire sans couleur — noir, blanc, gris — garde un accent sans couleur.
// Lui appliquer le plancher de saturation la ferait virer au rose, puisque la
// teinte d'un gris vaut zéro et que zéro est du rouge.
function accentOf(rgb) {
    const hsl = toHsl(rgb);
    const saturation = hsl.saturation === 0 ? 0 : Math.max(hsl.saturation, ACCENT_FLOOR_SATURATION);
    return fromHsl(hsl.hue, saturation, ACCENT_LIGHTNESS);
}

function setRootVariable(name, value) {
    document.documentElement.style.setProperty(name, value);
}

// La couleur primaire et tout ce qui en découle, écrits ensemble. Les trois
// chemins qui changent cette couleur — le démarrage, le menu réglages, l'écran de
// bienvenue — passent par ici : écrire --primary-color seul laisserait l'accent
// du bandeau sur la teinte précédente, et rien ne le signalerait.
export function setPrimaryColor(hex) {
    setRootVariable("--primary-color", hex);

    const rgb = channels(hex);
    // Une valeur illisible laisse les dérivées en place plutôt que d'écrire une
    // variable vide : le css a un repli, mais une variable définie à rien casse
    // la déclaration rgba() qui la reprend.
    if (!rgb) return;

    const accent = accentOf(rgb);
    setRootVariable("--primary-color-rgb", rgb.join(", "));
    setRootVariable("--accent-color", "rgb(" + accent.join(", ") + ")");
    setRootVariable("--accent-color-rgb", accent.join(", "));
}

// Le jeu complet, tel que le démarrage le résout depuis la base ou la config.
export function applyInterfaceColors(color) {
    setPrimaryColor(color.primaryColor);
    setRootVariable("--primary-background",
        convertHexToRGBA(color.primaryBackground, color.primaryBackgroundOpacity));
    setRootVariable("--default-background-game-menu",
        convertHexToRGBA(color.backgroundColor, color.backgroundColorOpacity));
}
