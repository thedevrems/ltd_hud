const STEPS = 2000 / 20;

// Walks a value to its target over a fixed frame budget, as the build's tween did.
export function countTo(from, to, onValue) {
    let remaining = STEPS;
    const stride = Math.abs(from - to) / STEPS;
    let value = from;
    const step = () => {
        if (remaining <= 0 || (from < to && value >= to) || (from > to && value <= to)) {
            return onValue(to);
        }
        value = from < to ? value + stride : value - stride;
        onValue(Math.floor(value));
        remaining--;
        requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
}
