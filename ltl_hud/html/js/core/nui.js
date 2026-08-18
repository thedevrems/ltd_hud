import { trace, warn } from "./debug.js";

let debugMode = false;
let resourceName = null;

// Tracing our own mirror would recurse, so debug.* endpoints stay silent.
const SILENT_PREFIX = "debug.";

// Resolved lazily: GetParentResourceName only exists once the NUI frame runs.
function endpoint(name) {
    if (resourceName === null) {
        resourceName = typeof GetParentResourceName === "function" ? GetParentResourceName() : "ltl_hud";
        trace("nui", `resource resolved as "${resourceName}"`);
    }
    return `https://${resourceName}/${name}`;
}

export function setDebugMode(state) {
    debugMode = !!state;
}

export function isDebugMode() {
    return debugMode;
}

// External links leave the NUI frame through the CEF native bridge.
export function openUrl(url) {
    if (url && typeof window.invokeNative === "function") window.invokeNative("openUrl", url);
}

// Every callback posts the same shape the Vue build used.
export function post(name, payload) {
    const silent = name.startsWith(SILENT_PREFIX);
    if (debugMode) {
        if (!silent) trace("nui", `post "${name}" skipped (browser debug mode)`, payload);
        return Promise.resolve("");
    }
    if (!silent) trace("nui", `-> ${name}`, payload);
    return fetch(endpoint(name), {
        mode: "no-cors",
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload === undefined ? {} : payload)
    }).then(response => response.text()).catch(err => {
        // The build swallowed these; an unregistered callback is worth knowing about.
        if (!silent) warn("nui", `post "${name}" failed: ${err && err.message}`);
        return "";
    });
}
