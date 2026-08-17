const stores = new Map();

// Minimal observable store: plain state plus a subscriber set.
export function createStore(name, initialState) {
    if (stores.has(name)) return stores.get(name);

    const listeners = new Set();
    const state = initialState;

    const store = {
        name,
        state,
        subscribe(listener) {
            listeners.add(listener);
            return () => listeners.delete(listener);
        },
        emit() {
            listeners.forEach(listener => listener(state));
        },
        set(key, value) {
            state[key] = value;
            store.emit();
        },
        assign(patch) {
            Object.assign(state, patch);
            store.emit();
        }
    };

    stores.set(name, store);
    return store;
}

export function getStore(name) {
    return stores.get(name);
}

// Read a dotted path, returning fallback when any segment is missing.
export function readPath(source, path, fallback) {
    const segments = String(path).split(".");
    let current = source;
    for (let i = 0; i < segments.length; i++) {
        if (current == null || typeof current !== "object") return fallback;
        current = current[segments[i]];
    }
    return current === undefined ? fallback : current;
}

// Write a dotted path, creating intermediate objects as needed.
export function writePath(target, path, value) {
    const segments = String(path).split(".");
    const last = segments.pop();
    let current = target;
    for (const segment of segments) {
        if (typeof current[segment] !== "object" || current[segment] === null) current[segment] = {};
        current = current[segment];
    }
    current[last] = value;
    return target;
}
