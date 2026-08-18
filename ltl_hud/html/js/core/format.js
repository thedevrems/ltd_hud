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

const CURRENCY_LOCALES = {
    USD: "en-US", EUR: "de-DE", CHF: "fr-CH", PLN: "pl-PL", GBP: "en-GB",
    CNY: "zh-CN", JPY: "ja-JP", AUD: "en-AU", CAD: "en-CA", BRL: "pt-BR",
    RUB: "ru-RU", MXN: "es-MX", SEK: "sv-SE", NOK: "nb-NO", DKK: "da-DK",
    CZK: "cs-CZ", HUF: "hu-HU", TRY: "tr-TR", ZAR: "en-ZA", INR: "en-IN"
};
const FALLBACK_CURRENCY = "USD";

function browserLocale() {
    if (typeof navigator === "undefined") return "en-US";
    return navigator.languages && navigator.languages.length ? navigator.languages[0] : navigator.language;
}

function isSupported(locale, currency) {
    try {
        new Intl.NumberFormat(locale, { style: "currency", currency });
        return true;
    } catch {
        return false;
    }
}

// Falls back to the browser locale, then to dollars, when the pair is unknown.
function resolveCurrency(name) {
    const currency = (name || FALLBACK_CURRENCY).toUpperCase();
    const browser = browserLocale();
    const locale = CURRENCY_LOCALES[currency] || browser;
    if (isSupported(locale, currency)) return { locale, currency };
    if (isSupported(browser, currency)) return { locale: browser, currency };
    return { locale: browser, currency: FALLBACK_CURRENCY };
}

// Wallet amounts are floored, grouped with spaces and never rounded up.
export function formatCurrency(value, currencyName, options) {
    const { locale, currency } = resolveCurrency(currencyName);
    const digits = options && options.removeDecimals ? 0 : 2;
    const amount = Number.isFinite(value) ? value : 0;
    return Math.floor(amount).toLocaleString(locale, {
        style: "currency",
        currency,
        minimumFractionDigits: digits,
        maximumFractionDigits: digits
    }).replace(/,/g, " ");
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
