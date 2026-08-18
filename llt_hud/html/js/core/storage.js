const SUFFIX = "_storage";

// Component slots persist under "<component lowercased>_storage".
export function keyFor(component) {
    return String(component).toLowerCase() + SUFFIX;
}

export function readRaw(key) {
    try {
        return localStorage.getItem(key);
    } catch (error) {
        return null;
    }
}

export function readJSON(key) {
    const raw = readRaw(key);
    if (!raw) return null;
    try {
        return JSON.parse(raw);
    } catch (error) {
        return null;
    }
}

export function writeJSON(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
        /* quota or disabled storage: the build fails silently too */
    }
}

export function readComponent(component) {
    return readJSON(keyFor(component));
}

export function writeComponent(component, value) {
    writeJSON(keyFor(component), value);
}

export function hasKey(key) {
    return !!readRaw(key);
}

export function removeKey(key) {
    try {
        localStorage.removeItem(key);
    } catch (error) {
        /* ignored, as in the build */
    }
}

export function clearAll() {
    try {
        localStorage.clear();
    } catch (error) {
        /* ignored, as in the build */
    }
}
