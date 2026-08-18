import { post } from "./nui.js";

// Debug channel for the NUI layer.
//
// Every trace goes through here so one switch drives the whole thing:
// Config.Debug arrives with SEND_FULL_CFG and calls setEnabled(). Until it does
// the channel stays open, otherwise the boot sequence would trace nothing.
//
// Lines land in the CEF console. The ones sent through log/warn/error are also
// mirrored to the F8 console via the "debug.log" NUI callback so the Lua trace
// and the NUI trace interleave in a single readable timeline. trace() is
// console-only and meant for the chatty paths (every dispatch, every post).

const MIRROR_LIMIT = 40;
const MIRROR_WINDOW = 1000;
const PAYLOAD_LIMIT = 600;
const FORCE_KEY = "ltl_debug";

const TAG_STYLE = "color:#ee1c3e;font-weight:700";
const SCOPE_STYLE = "color:#7ec8ff;font-weight:700";
const PLAIN_STYLE = "color:inherit;font-weight:400";

const providers = new Map();

let enabled = true;
let mirrorToLua = true;
let windowStart = 0;
let mirrored = 0;
let dropped = 0;

// localStorage wins over the config so a broken boot can still be traced.
function forcedState() {
    try {
        const raw = localStorage.getItem(FORCE_KEY);
        if (raw === null) return null;
        return raw === "1" || raw === "true";
    } catch (error) {
        return null;
    }
}

export function setEnabled(state) {
    const forced = forcedState();
    enabled = forced === null ? !!state : forced;
    if (forced !== null) console.log(`%c[ltl_hud]%c debug forced to ${enabled} by localStorage.${FORCE_KEY}`, TAG_STYLE, PLAIN_STYLE);
}

export function isEnabled() {
    return enabled;
}

export function setMirror(state) {
    mirrorToLua = !!state;
}

function clock() {
    return (performance.now() / 1000).toFixed(3) + "s";
}

function replacer(key, value) {
    if (value instanceof Node) return "<" + value.nodeName.toLowerCase() + ">";
    if (typeof value === "function") return "<fn>";
    if (typeof value === "symbol") return String(value);
    return value;
}

// Lua only ever receives a short printable string, never a live object.
function serialise(data) {
    if (data === undefined) return null;
    try {
        const text = JSON.stringify(data, replacer);
        if (text === undefined) return String(data);
        return text.length > PAYLOAD_LIMIT ? text.slice(0, PAYLOAD_LIMIT) + " ..." : text;
    } catch (error) {
        return "<unserialisable: " + error.message + ">";
    }
}

// The mirror is budgeted: a burst fills the CEF console but never floods F8.
function toLua(level, scope, message, data) {
    if (!mirrorToLua) return;
    const now = Date.now();
    if (now - windowStart > MIRROR_WINDOW) {
        windowStart = now;
        mirrored = 0;
        if (dropped) {
            const lost = dropped;
            dropped = 0;
            post("debug.log", { level: "warn", scope: "debug", message: lost + " mirrored line(s) dropped (budget)" });
        }
    }
    if (mirrored >= MIRROR_LIMIT) {
        dropped++;
        return;
    }
    mirrored++;
    post("debug.log", { level, scope, message, data: serialise(data) });
}

function emit(level, scope, message, data, mirror) {
    if (!enabled) return;
    const method = console[level] || console.log;
    const head = `%c[ltl_hud]%c[${scope}]%c ${clock()} ${message}`;
    if (data === undefined) method(head, TAG_STYLE, SCOPE_STYLE, PLAIN_STYLE);
    else method(head, TAG_STYLE, SCOPE_STYLE, PLAIN_STYLE, data);
    if (mirror) toLua(level, scope, message, data);
}

export function log(scope, message, data) {
    emit("log", scope, message, data, true);
}

export function trace(scope, message, data) {
    emit("log", scope, message, data, false);
}

export function warn(scope, message, data) {
    emit("warn", scope, message, data, true);
}

export function error(scope, message, data) {
    emit("error", scope, message, data, true);
}

// One binding per module keeps the scope tag out of every call site.
export function scoped(scope) {
    return {
        log: (message, data) => log(scope, message, data),
        trace: (message, data) => trace(scope, message, data),
        warn: (message, data) => warn(scope, message, data),
        error: (message, data) => error(scope, message, data),
        dump: reason => dump(scope + (reason ? ":" + reason : ""))
    };
}

// Modules hand back a plain object so one dump prints the whole UI state.
export function provide(name, reader) {
    providers.set(name, reader);
}

export function snapshot() {
    const out = {};
    providers.forEach((reader, name) => {
        try {
            out[name] = reader();
        } catch (err) {
            out[name] = "<reader failed: " + err.message + ">";
        }
    });
    return out;
}

// Prints the snapshot to CEF and mirrors it section by section to F8, so a
// single /hud_debug shows both halves of the pipeline side by side.
export function dump(reason) {
    const data = snapshot();
    const label = reason || "manual";
    console.log(`%c[ltl_hud]%c[dump]%c ${clock()} ${label}`, TAG_STYLE, SCOPE_STYLE, PLAIN_STYLE, data);
    toLua("log", "dump", "---- NUI STATE DUMP (" + label + ") ----");
    Object.keys(data).forEach(name => toLua("log", "dump", name, data[name]));
    toLua("log", "dump", "---- END OF DUMP ----");
    return data;
}

// Reachable from the CEF devtools console: LTLHUD_DEBUG.dump().
window.LTLHUD_DEBUG = {
    dump,
    snapshot,
    setEnabled: state => {
        enabled = !!state;
        return enabled;
    },
    setMirror,
    isEnabled
};

export default { log, trace, warn, error, scoped, provide, snapshot, dump, setEnabled, setMirror, isEnabled };
