# ltl_hud

[English](README.md) · **Français**

Ressource d'interface pour FiveM : statuts HUD, HUD véhicule, notifications, text UI,
barres de progression, chat, menus in-game, menu pause, paramètres, écran de bienvenue et
mode cinématique.

Conçue pour le LTL Framework (`ltl_core`) et pma-voice.

---

## Sommaire

- [Prérequis](#prérequis)
- [Installation](#installation)
- [Configuration](#configuration)
- [Architecture de l'interface](#architecture-de-linterface)
- [Contrat de messages](#contrat-de-messages)
- [Écrans](#écrans)
- [Travailler sur l'interface](#travailler-sur-linterface)
- [Conventions](#conventions)

---

## Prérequis

| Dépendance | Rôle |
| --- | --- |
| `ltl_core` | données joueur, métier, argent |
| `pma-voice` | indicateur vocal et proximité |
| `ox_lib` | amorçage partagé (`@ox_lib/init.lua`) |
| `ltl_status` / `esx_status` | *optionnel* — alimente les jauges faim, soif et stress |

La ressource embarque également un timecycle modifier
(`stream/map_timecycle_stream.xml`) et les sprites DUI utilisés par la couche 3D.

## Installation

1. Placez le dossier dans votre répertoire de ressources.
2. Démarrez-la après ses dépendances :

```cfg
ensure ltl_core
ensure pma-voice
ensure ltl_hud
```

La ressource récupère le framework via `exports['ltl_core']:getSharedObject()` et écoute
`ltl:playerLoaded`, `ltl:playerLogout`, `ltl:setJob` ainsi que les trois évènements
`ltl:*AccountMoney`.

Les statuts vivent hors du core. `client/addon/status.lua` s'abonne aux **deux**
évènements `ltl_status:onTick` et `esx_status:onTick` : les jauges faim, soif et stress
traversent donc le renommage `esx_status` → `ltl_status` sans aucune modification de ce
côté. Une fois la bascule terminée partout, retirez `esx_status` de la liste
`StatusProviders` en tête de ce fichier.

3. Redémarrez le serveur. L'interface se construit au premier message `SEND_FULL_CFG`.

Aucune étape de build n'est nécessaire : l'interface est du HTML, du CSS et du JavaScript
servis tels quels par la page NUI.

## Configuration

| Fichier | Contenu |
| --- | --- |
| `shared/config_ui.lua` | interrupteurs globaux de l'interface |
| `shared/ui_cfg/*.lua` | valeurs par défaut de chaque composant (HUD, HUD véhicule, notifications, chat, …) |
| `shared/translations/ui.lua` | textes de l'interface, envoyés via `LOAD_UP_TRANSLATIONS` |
| `client/config/*.lua` | touches et seuils côté client |
| `server/config/*.lua` | options côté serveur |

Les préférences joueur (variantes choisies, couleurs, positions des composants, presets)
vivent dans le `localStorage` du NUI et sont répliquées côté serveur par
`config_preset_saver.lua`.

## Architecture de l'interface

La couche web est sans framework : pas de Vue, pas de bundler, aucune transpilation.
`html/index.html` déclare tous les conteneurs et charge directement des modules ES.

```
html/
├── index.html              # conteneurs de chaque écran et de chaque composant
├── css/                    # une feuille de style par composant et par variante
├── js/
│   ├── main.js             # enregistre tous les composants, puis démarre le bus
│   ├── core/               # infrastructure partagée
│   └── components/         # un module par composant, exposant register(bus)
└── assets/                 # effets sonores
```

### Modules du noyau

| Module | Responsabilité |
| --- | --- |
| `bus.js` | écoute `window.message`, route le `type` vers son handler, gère les messages transverses |
| `screens.js` | table des routes, transitions et gestion de la touche échap |
| `state.js` | conteneurs d'état observables, abonnés par clé |
| `nui.js` | poste les callbacks vers `GetParentResourceName()` |
| `storage.js` | persistance `localStorage` des presets et des positions |
| `sfx.js` | encapsulation `Audio()` des sons de `assets/` |
| `i18n.js` | traductions reçues via `LOAD_UP_TRANSLATIONS` |
| `dom.js` | création d'éléments, bascule de classes, helpers Web Animations |
| `config.js`, `bootstrap.js` | fusion de la config Lua et des préférences stockées, publication des variables CSS |
| `*store.js` | état par domaine (base, jeu, chat, menu, musique, joueur, voix, …) |

Les composants ne s'importent jamais entre eux. Tout ce qu'ils partagent transite par un
store ou par le bus, ce qui rend chaque module testable et supprimable indépendamment.

### Animations et audio

Les transitions sont en CSS partout où le CSS suffit. Les séquences qui demandent des
courbes d'easing chaînées — le fondu du black screen, l'apparition en cascade, le balayage
du slider de minimap — passent par la Web Animations API via `dom.js`. Les sons sont de
simples éléments `Audio()` : les boucles réutilisent un élément, les sons ponctuels se
superposent.

Chaque effet est déclaré dans `core/sfx.js`. Ajouter `enabled: false` à une entrée le rend
muet sans toucher à ses appelants :

```js
enter_welcome: { file: "enter_welcome.wav", volume: .2, enabled: true },
```

## Contrat de messages

Le Lua fait foi. L'interface enregistre **84** types de messages :

- **72 types actifs** émis par `client/` et effectivement traités.
- **6 types hérités du build** conservés en sur-ensemble, pour que le bus tolère des
  messages que ce `client/` n'émet pas aujourd'hui (`OBTAIN_LOCAL_DATA`, `PREVIEW_INIT`,
  `SET_GAME_STORAGE`, `SET_TRANSITION_IMAGE`, `PROGRESS_BAR_UPDATE_PROGRESS`,
  `CHAT_REMOVE_ALL_SUGGESTIONS`).
- **6 types inertes** émis par `client/` que l'interface ignore volontairement
  (`ADD_BLIP`, `INIT_WELCOME`, `REMOVE_STORAGE`, `SEND_STORAGE`, `SET_CONTEXT_DATA`,
  `UPDATE_ASPECT_RATIO`). Ils n'ont aucun consommateur : les traiter changerait le
  comportement en jeu.

Un type inconnu est ignoré silencieusement.

Les messages partent du Lua de la manière habituelle :

```lua
SendNUIMessage({ type = "ADD_NOTIFY", data = { serial = serial, text = text } })
```

L'interface répond avec **32** callbacks, tous de la même forme :

```js
fetch(`https://${GetParentResourceName()}/<name>`, {
    mode: "no-cors",
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
});
```

Trois callbacks enregistrés côté Lua ne sont jamais postés : `mapChangeCoordinates`,
`mapOffsetView` et `mapZOffsetView`. La route grande carte n'a aucun composant
d'interface, donc rien ne les déclenche.

## Écrans

`core/screens.js` remplace le routeur. Les chemins sont en minuscules et un chemin
imbriqué garde son parent monté.

| Chemin | Écran |
| --- | --- |
| `/` | écran de jeu (HUD, HUD véhicule, notifications, chat, bloc minimap) |
| `/blank` | état de démarrage, avant l'arrivée de la configuration |
| `/welcome` | parcours de bienvenue — enfants `music`, `presets`, `customize` |
| `/menu` | paramètres — enfants `color`, `hud`, `carhud`, `notifications`, `helpNotify`, `progressBar`, `misc` |
| `/pausemenu` | menu pause |
| `/mainmenu` | menu principal |
| `/cinematic` | mode cinématique |
| `/preview` | aperçu du personnage |
| `/position` | repositionnement des composants |
| `/transition` | emplacement de transition |
| `/map` | emplacement de la grande carte |

Les changements d'écran jouent les mêmes effets qu'avant : `plum` à l'ouverture du menu
pause depuis le jeu, `enter` à l'ouverture des paramètres depuis le menu pause.

## Travailler sur l'interface

Comme rien n'est compilé, modifier un fichier de `html/` puis redémarrer la ressource
suffit. La boucle recommandée :

1. Modifiez le module du composant et sa feuille de style.
2. Rechargez la ressource en jeu, ou ouvrez `html/index.html` dans un navigateur avec un
   stub de `GetParentResourceName` et un `fetch` intercepté pour inspecter les callbacks.
3. Rejouez de vrais messages avec `window.postMessage({ type, data }, "*")`.

### Ajouter un composant

1. Créez `html/js/components/<nom>.js` exposant une unique fonction `register(bus)`.
2. Créez `html/css/<nom>.css` et référencez-la depuis `index.html`.
3. Ajoutez le conteneur dans `index.html`.
4. Enregistrez le composant dans `html/js/main.js`, avant `bus.start()`.
5. Ajoutez ses types de messages dans `core/message-types.js`.

## Conventions

- Aucun framework, aucun bundler, aucune étape de build.
- Une responsabilité par fonction, 60 lignes maximum.
- 300 lignes maximum par fichier — découpez par composant ou par variante.
- Les utilitaires partagés vont dans `js/core/`, jamais dupliqués dans les composants.
- Les composants communiquent par les stores ou par le bus, jamais par import direct.
- Les messages de commit suivent Conventional Commits.
