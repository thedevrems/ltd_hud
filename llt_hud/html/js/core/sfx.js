const ASSET_PATH = "./assets/";

// Set `enabled: false` on any entry to mute that effect without touching its callers.
const DEFINITIONS = {
    click: { file: "click_ui.mp3", volume: .2 },
    enter: { file: "enter.mp3", volume: .2 },
    plum: { file: "plum.mp3", volume: .2 },
    woosh: { file: "woosh.mp3", volume: .125 },
    woosh2: { file: "woosh2.mp3", volume: .5 },
    soft_woosh: { file: "soft-woosh.mp3", volume: .1 },
    hard_woosh: { file: "woosh3.mp3", volume: .25 },
    enter_welcome: { file: "enter_welcome.wav", volume: .2, enabled: true },
    notify_enter: { file: "notify.mp3", volume: .4 },
    wind: { file: "wind.mp3", volume: .3 },
    buckle: { file: "buckle.ogg", volume: .2 },
    unbuckle: { file: "unbuckle.ogg", volume: .2 },
    unfasten: { file: "unfastenIndicator.mp3", volume: .1, loop: true }
};

class Sound {
    constructor(definition) {
        this.src = ASSET_PATH + definition.file;
        this.level = definition.volume;
        this.loop = !!definition.loop;
        this.enabled = definition.enabled !== false;
        this.instances = new Set();
        this.looped = this.loop ? this.build() : null;
    }

    build() {
        const audio = new Audio(this.src);
        audio.volume = this.level;
        audio.loop = this.loop;
        audio.preload = "auto";
        return audio;
    }

    // Looping sounds reuse one element; one-shots overlap like Howler does.
    play() {
        if (!this.enabled) return;
        if (this.loop) {
            this.looped.currentTime = 0;
            void this.looped.play().catch(() => {});
            return;
        }
        const audio = this.build();
        this.instances.add(audio);
        audio.addEventListener("ended", () => this.instances.delete(audio));
        void audio.play().catch(() => this.instances.delete(audio));
    }

    stop() {
        if (this.loop) {
            this.looped.pause();
            this.looped.currentTime = 0;
            return;
        }
        this.instances.forEach(audio => {
            audio.pause();
            audio.currentTime = 0;
        });
        this.instances.clear();
    }

    volume(value) {
        this.level = value;
        if (this.looped) this.looped.volume = value;
        this.instances.forEach(audio => { audio.volume = value; });
    }
}

const sfx = {};
for (const name in DEFINITIONS) sfx[name] = new Sound(DEFINITIONS[name]);

export default sfx;

// Guarded entry point for HANDLE_SFX_MESSAGE payloads.
export function play(name) {
    if (sfx[name]) sfx[name].play();
}
