let debugMode = false;
let resourceName = null;

// Resolved lazily: GetParentResourceName only exists once the NUI frame runs.
function endpoint(name) {
    if (resourceName === null) {
        resourceName = typeof GetParentResourceName === "function" ? GetParentResourceName() : "ltl_hud";
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
    if (debugMode) return Promise.resolve("");
    return fetch(endpoint(name), {
        mode: "no-cors",
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload === undefined ? {} : payload)
    }).then(response => response.text()).catch(() => "");
}
