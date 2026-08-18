import { el, setText, setImageSource, animate } from "../core/dom.js";
import { EASING } from "../core/animations.js";

const SLIDER_DURATION = 1000;

// The now-playing block: cover art, author and the elapsed bar.
export function createMusicBlock() {
    const root = el("div", "music-container");
    const content = el("div", "content");
    const author = el("div", "author");
    const textBox = el("div", "text-box");
    const preImage = el("div", "pre-img");
    const image = el("img");
    const progress = el("div", "progress");
    const value = el("div", "value");
    textBox.appendChild(author);
    preImage.appendChild(image);
    content.append(el("div", "button"), textBox, preImage);
    progress.appendChild(value);
    root.append(content, progress);
    return {
        root,
        update(data) {
            setText(author, data.author);
            setImageSource(image, data.img);
            value.style.width = (data.progress || 0) + "%";
        }
    };
}

function slideSaved(slider, input) {
    const away = animate(slider, { left: ["-100%", "0%"] }, { duration: SLIDER_DURATION, easing: EASING });
    const back = () => {
        input.value = "";
        animate(slider, { left: ["0%", "100%"] }, { duration: SLIDER_DURATION, easing: EASING });
    };
    if (away) away.onfinish = back;
    else back();
}

// Enter submits the url, then a confirmation slider wipes the field clean.
export function createTextInput(onInput) {
    const root = el("div", "input-text");
    const slider = el("div", "slider");
    const input = el("input", null, { type: "text" });
    root.append(slider, input);
    input.onkeyup = event => {
        if (event.key !== "Enter") return;
        onInput(input.value);
        slideSaved(slider, input);
    };
    return {
        root,
        setTexts(placeholder, sliderText) {
            input.placeholder = placeholder;
            setText(slider, sliderText);
        }
    };
}
