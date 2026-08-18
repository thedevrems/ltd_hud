const MOVE_THRESHOLD = 2;

function applyPosition(node, left, top) {
    node.style.left = left + "px";
    node.style.top = top + "px";
}

function beginDrag(node, event) {
    return {
        pointerX: event.clientX,
        pointerY: event.clientY,
        left: node.offsetLeft,
        top: node.offsetTop,
        moved: false
    };
}

function onMove(state, node, handlers, event) {
    const left = state.left + (event.clientX - state.pointerX);
    const top = state.top + (event.clientY - state.pointerY);
    if (!state.moved && !passedThreshold(state, event)) return;
    if (!state.moved) {
        state.moved = true;
        handlers.onDrag();
    }
    state.current = { x: left, y: top };
    applyPosition(node, left, top);
}

function passedThreshold(state, event) {
    return Math.abs(event.clientX - state.pointerX) > MOVE_THRESHOLD
        || Math.abs(event.clientY - state.pointerY) > MOVE_THRESHOLD;
}

// Replaces the GSAP draggable: left/top follow the pointer, nothing else.
export function makeDraggable(node, handlers) {
    let state = null;
    const move = event => onMove(state, node, handlers, event);
    const up = () => {
        window.removeEventListener("mousemove", move);
        window.removeEventListener("mouseup", up);
        if (state.moved) handlers.onDragEnd(state.current, node.getBoundingClientRect());
        else handlers.onClick();
        state = null;
    };
    node.addEventListener("mousedown", event => {
        state = beginDrag(node, event);
        window.addEventListener("mousemove", move);
        window.addEventListener("mouseup", up);
    });
}
