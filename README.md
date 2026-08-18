# ltl_hud

**English** · [Français](README.fr.md)

User interface resource for FiveM: HUD statuses, vehicle HUD, notifications, text UI,
progress bars, chat, in-game menus, pause menu, settings, welcome flow and cinematic mode.

Built for ESX and pma-voice.

---

## Contents

- [Requirements](#requirements)
- [Installation](#installation)
- [Configuration](#configuration)
- [Interface architecture](#interface-architecture)
- [Message contract](#message-contract)
- [Screens](#screens)
- [Working on the interface](#working-on-the-interface)
- [Conventions](#conventions)

---

## Requirements

| Dependency | Purpose |
| --- | --- |
| `es_extended` | player data, job, money |
| `pma-voice` | voice indicator and proximity |
| `ox_lib` | shared bootstrap (`@ox_lib/init.lua`) |

The resource also ships a timecycle modifier (`stream/map_timecycle_stream.xml`) and DUI
sprites used by the 3D layer.

## Installation

1. Drop the folder into your resources directory.
2. Ensure it after its dependencies:

```cfg
ensure es_extended
ensure pma-voice
ensure ltl_hud
```

3. Restart the server. The interface builds itself on the first `SEND_FULL_CFG` message.

No build step is required: the interface is plain HTML, CSS and JavaScript served as-is
by the NUI page.

## Configuration

| File | Contents |
| --- | --- |
| `shared/config_ui.lua` | global interface switches |
| `shared/ui_cfg/*.lua` | per-component defaults (HUD, car HUD, notifications, chat, …) |
| `shared/translations/ui.lua` | interface strings, pushed through `LOAD_UP_TRANSLATIONS` |
| `client/config/*.lua` | client-side keybinds and thresholds |
| `server/config/*.lua` | server-side options |

Player overrides (chosen variants, colours, component positions, presets) live in the NUI
`localStorage` and are mirrored server-side by `config_preset_saver.lua`.

## Interface architecture

The web layer is framework-free: no Vue, no bundler, no transpilation. `html/index.html`
declares every container up front and loads ES modules directly.

```
html/
├── index.html              # containers for every screen and component
├── css/                    # one stylesheet per component and per variant
├── js/
│   ├── main.js             # registers all components, then starts the bus
│   ├── core/               # shared infrastructure
│   └── components/         # one module per component, each exporting register(bus)
└── assets/                 # sound effects
```

### Core modules

| Module | Responsibility |
| --- | --- |
| `bus.js` | listens to `window.message`, routes `type` to its handler, owns the transverse messages |
| `screens.js` | route table, transitions and escape handling |
| `state.js` | observable state containers with per-key subscribers |
| `nui.js` | posts callbacks to `GetParentResourceName()` |
| `storage.js` | `localStorage` persistence for presets and positions |
| `sfx.js` | `Audio()` wrapper over `assets/` |
| `i18n.js` | translations received through `LOAD_UP_TRANSLATIONS` |
| `dom.js` | element creation, class toggling, Web Animations helpers |
| `config.js`, `bootstrap.js` | merge the Lua config with stored overrides, publish CSS variables |
| `*store.js` | per-domain state (base, game, chat, menu, music, player, voice, …) |

Components never import each other. Everything they share travels through a store or the
bus, which keeps each module independently testable and removable.

### Animation and audio

Transitions are CSS wherever CSS is expressive enough. Sequences that need chained easing
curves — the black screen fade, the stagger reveal, the minimap slider sweep — use the Web
Animations API through `dom.js`. Sounds are plain `Audio()` elements: looping effects reuse
one element, one-shots overlap.

Every effect is declared in `core/sfx.js`. Adding `enabled: false` to an entry mutes it
without touching any caller:

```js
enter_welcome: { file: "enter_welcome.wav", volume: .2, enabled: true },
```

## Message contract

The Lua side is the authority. The interface registers **84** message types:

- **72 live types** emitted by `client/` and acted upon.
- **6 build-only types** kept as a superset so the bus tolerates messages this `client/`
  does not currently emit (`OBTAIN_LOCAL_DATA`, `PREVIEW_INIT`, `SET_GAME_STORAGE`,
  `SET_TRANSITION_IMAGE`, `PROGRESS_BAR_UPDATE_PROGRESS`, `CHAT_REMOVE_ALL_SUGGESTIONS`).
- **6 inert types** emitted by `client/` that the interface deliberately ignores
  (`ADD_BLIP`, `INIT_WELCOME`, `REMOVE_STORAGE`, `SEND_STORAGE`, `SET_CONTEXT_DATA`,
  `UPDATE_ASPECT_RATIO`). They have no consumer, so acting on them would change in-game
  behaviour.

An unknown type is discarded silently.

Messages are sent from Lua the usual way:

```lua
SendNUIMessage({ type = "ADD_NOTIFY", data = { serial = serial, text = text } })
```

The interface answers with **32** callbacks, all sharing one shape:

```js
fetch(`https://${GetParentResourceName()}/<name>`, {
    mode: "no-cors",
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
});
```

Three callbacks registered in Lua are never posted: `mapChangeCoordinates`,
`mapOffsetView` and `mapZOffsetView`. The big-map route has no interface component, so
nothing drives them.

## Screens

`core/screens.js` replaces the router. Paths are lowercase, nested paths keep their parent
mounted.

| Path | Screen |
| --- | --- |
| `/` | game screen (HUD, car HUD, notifications, chat, minimap block) |
| `/blank` | startup state, before the first configuration arrives |
| `/welcome` | welcome flow — children `music`, `presets`, `customize` |
| `/menu` | settings — children `color`, `hud`, `carhud`, `notifications`, `helpNotify`, `progressBar`, `misc` |
| `/pausemenu` | pause menu |
| `/mainmenu` | main menu |
| `/cinematic` | cinematic mode |
| `/preview` | character preview |
| `/position` | component repositioning |
| `/transition` | transition placeholder |
| `/map` | big map placeholder |

Screen changes play the same effects as before: `plum` when the pause menu opens from the
game, `enter` when the settings open from the pause menu.

## Working on the interface

Since nothing is compiled, editing a file under `html/` and restarting the resource is
enough. The recommended loop is:

1. Edit the component module and its stylesheet.
2. Reload the resource in game, or open `html/index.html` in a browser with a stub for
   `GetParentResourceName` and an intercepted `fetch` to inspect callbacks.
3. Replay real messages with `window.postMessage({ type, data }, "*")`.

### Adding a component

1. Create `html/js/components/<name>.js` exporting a single `register(bus)` function.
2. Create `html/css/<name>.css` and link it from `index.html`.
3. Add the container element to `index.html`.
4. Register the component in `html/js/main.js`, before `bus.start()`.
5. Add its message types to `core/message-types.js`.

## Conventions

- No framework, no bundler, no build step.
- One responsibility per function, 60 lines maximum.
- 300 lines maximum per file — split by component or by variant.
- Shared helpers belong in `js/core/`, never duplicated across components.
- Components communicate through stores or the bus, never by importing each other.
- Commit messages follow Conventional Commits.
