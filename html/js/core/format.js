// Hex colour plus opacity to the rgba() string the CSS variables expect.
export function convertHexToRGBA(hex, alpha) {
    const r = parseInt(hex.substr(1, 2), 16);
    const g = parseInt(hex.substr(3, 2), 16);
    const b = parseInt(hex.substr(5, 2), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

const COLOUR_TAG = /\|([a-zA-Z]+)=([^|]+)\|/g;
const GAME_TAG = /~[a-zA-Z]~/g;

// Server colour tags to markup; the unbalanced closing tag matches the build.
export function transformUsingRegex(text) {
    if (text == null) return "";
    return String(text)
        .replace(COLOUR_TAG, (match, name, value) => `<span class="${name}">${value}</div>`)
        .replace(GAME_TAG, "");
}

// Preset coordinates accept numbers, percentages, px, vw and vh.
export function toPixels(value, base) {
    if (typeof value === "number") return Math.round(value * base);
    if (typeof value === "string") {
        const trimmed = value.trim();
        if (trimmed.endsWith("%")) return Math.round(parseFloat(trimmed) / 100 * base);
        if (trimmed.endsWith("px")) return Math.round(parseFloat(trimmed));
        if (trimmed.endsWith("vw")) return Math.round(parseFloat(trimmed) / 100 * window.innerWidth);
        if (trimmed.endsWith("vh")) return Math.round(parseFloat(trimmed) / 100 * window.innerHeight);
    }
    return Math.round(Number(value) || 0);
}
