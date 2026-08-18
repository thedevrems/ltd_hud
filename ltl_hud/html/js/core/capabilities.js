function hudEntry(smoothEdges) {
    return { "3d-mode": true, shadows: true, iconShadow: true, smoothEdges, under50: true };
}

// Which options each interface variant actually supports, as the build declared.
export const HUD_OPTIONS = {
    basic: hudEntry(true),
    skew: hudEntry(true),
    circle: hudEntry(false),
    diamond: hudEntry(true),
    modern: hudEntry(true),
    hexagon: hudEntry(false),
    square: hudEntry(false)
};

export const HELPNOTIFY_OPTIONS = {
    basic: { shadows: true, smoothEdges: true, background: true },
    diamond: { shadows: true, smoothEdges: false, background: false },
    hexagon: { shadows: true, smoothEdges: true, background: true }
};

export function optionsOf(table, selected) {
    return table[selected] || {};
}
