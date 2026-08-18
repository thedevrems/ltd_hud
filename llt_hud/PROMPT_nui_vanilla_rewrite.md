# Mission : réécriture vanilla de l'UI NUI de `ltl_hud`

Tu travailles dans la ressource FiveM `ltl_hud`. Sa partie web (`html/`) est un build Vue 3 minifié (Vue + Pinia + vue-router + anime.js + Howler). Ta mission : la réécrire intégralement en **HTML / CSS / JS vanilla, sans framework et sans build step**, de façon **strictement iso-fonctionnelle** : le Lua ne doit subir AUCUNE modification, et chaque composant doit se comporter à l'identique en jeu.

Travaille étape par étape, dans l'ordre des phases ci-dessous. Ne commence jamais une phase sans avoir terminé et committé la précédente.

---

## 1. Entrées disponibles

- `html/index.html` — point d'entrée actuel (monte `#app`, charge le build).
- `html/assets/index-Bs2arf7F.js` — build JS minifié (~650 Ko). Source de vérité pour la logique et la structure DOM.
- `html/assets/index.css` — CSS minifié (~115 Ko). Les noms de classes sont sémantiques et quasi non scoppés : réutilisable après beautify.
- `html/assets/*.mp3|ogg|wav` — SFX à conserver tels quels.
- `client/functions/handlers/nui.lua` + tout `client/` — contrat NUI côté jeu (source de vérité absolue).
- `shared/ui_cfg/*.lua`, `shared/translations/ui.lua`, `shared/config_ui.lua` — configs et traductions envoyées à l'UI.

## 2. Contraintes non négociables

- Zéro framework, zéro bundler, zéro étape de build : les fichiers livrés sont servis tels quels par le NUI.
- Iso-fonctionnel : mêmes types de messages traités, mêmes callbacks postés avec les mêmes payloads, mêmes écrans, mêmes animations perçues, mêmes SFX, même persistance `localStorage`.
- Aucune modification des fichiers Lua. Si un comportement paraît ambigu, la référence est le comportement du build actuel, pas ton interprétation.
- Fonctions de 60 lignes maximum. Fichiers de 300 lignes maximum (découpe par composant si besoin).
- Une fonction = une responsabilité. Zéro duplication de code : tout utilitaire partagé va dans `js/core/`.
- Maximum un commentaire par fonction, en anglais.
- Aucune mention d'IA nulle part (code, commits, README).
- Commits en anglais, Conventional Commits, diff ≤ 1000 lignes par commit (découpe la phase en plusieurs commits si nécessaire).
- Workflow Git : branche `feature/nui-vanilla-rewrite`, jamais de commit direct sur `main`, merge final en `--no-ff`.
- Dépendances externes : conserve les CDN d'icônes déjà présents dans `index.html` (Phosphor, FontAwesome). Remplace Howler par un wrapper `Audio()` maison et anime.js par des transitions/animations CSS ; si une animation est impossible à reproduire fidèlement en CSS (ex. easings cubicBezier chaînés sur le black screen), utilise `element.animate()` (Web Animations API), toujours sans dépendance.

## 3. Méthode d'extraction (à appliquer à chaque composant)

1. Beautifie une copie de travail du build (hors `html/`, ex. `_work/index.beautified.js`, non committée — ajoute `_work/` au `.gitignore`) : `npx js-beautify html/assets/index-Bs2arf7F.js -o _work/index.beautified.js`. Fais de même pour le CSS.
2. La map complète des handlers de messages est en clair dans le JS beautifié (cherche `SET_SCREEN: function` pour la localiser). Chaque handler montre exactement quoi faire du payload : c'est ta spec.
3. Les render functions compilées conservent balises et classes (`class:"..."`). Reconstitue le markup HTML de chaque composant à partir d'elles, en croisant avec les sélecteurs du CSS.
4. Les stores Pinia (cherche `defineStore` / les objets `state()`) donnent le modèle de données de chaque composant : réécris-les en modules d'état simples.
5. Vérifie systématiquement le contrat côté Lua avec `grep -rn "NUI.SendMessage\|SendNUIMessage\|RegisterNUICallback" client/` — la liste de l'annexe (section 7) doit correspondre ; en cas d'écart, le Lua fait foi.

## 4. Architecture cible

```
html/
├── index.html                  # monte les conteneurs de tous les composants
├── css/
│   ├── base.css                # variables, reset, layout global, écrans
│   └── <composant>.css         # un fichier par composant
├── js/
│   ├── core/
│   │   ├── bus.js              # écoute window "message", route type -> handler
│   │   ├── screens.js          # remplace vue-router : gestion des écrans/vues
│   │   ├── state.js            # remplace Pinia : état + abonnés par composant
│   │   ├── nui.js              # post des callbacks vers GetParentResourceName()
│   │   ├── storage.js          # persistance localStorage (presets, positions)
│   │   ├── sfx.js              # wrapper Audio() des sons de assets/
│   │   ├── i18n.js             # traductions reçues via LOAD_UP_TRANSLATIONS
│   │   └── dom.js              # helpers DOM partagés (création, toggle, anim)
│   └── components/
│       └── <composant>.js      # register(bus) : handlers + rendu du composant
└── assets/                     # sons conservés, build supprimé en phase finale
```

Chaque composant expose une seule fonction d'enregistrement qui déclare ses handlers auprès du bus. `index.html` charge `core/` puis chaque composant en `<script type="module">`. Aucun composant n'importe un autre composant : tout passage d'information transite par `state.js` ou le bus.

## 5. Phases

Pour chaque phase : implémente, vérifie avec le harnais de test (section 6), puis committe.

**Phase 0 — Préparation.** Crée la branche, le `.gitignore` (`_work/`), beautifie le build dans `_work/`, produis `_work/CONTRACT.md` en vérifiant l'annexe contre le Lua réel. Commit : `chore(nui): set up rewrite workspace and contract inventory`.

**Phase 1 — Socle.** `index.html` nouveau (conteneurs vides, CDN icônes conservés), `css/base.css` (variables extraites du CSS existant : couleurs, fonts, z-index, l'échelle liée à `UPDATE_ASPECT_RATIO`), et tout `js/core/`. Le bus doit accepter les 75+ types de l'annexe avec des handlers no-op loggués, traiter les messages transverses (`SET_UI_VISIBLE`, `SET_SCREEN`, `SET_ROUTER_PATH`, `SET_UI_DATA_STATUS`, `LOAD_UP_TRANSLATIONS`, `SEND_FULL_CFG`, `SEND_STORAGE`, `REMOVE_STORAGE`, `UPDATE_ASPECT_RATIO`, `HANDLE_SFX_MESSAGE`, `HANDLE_BLACK_SCREEN`, `APPLY_EFFECT_ON_INTERFACE`, `SET_COMPONENT_VISIBILITY`, `SET_MINICOMPONENT_VISIBILITY`), et poster `base.onBodyLoaded` au chargement comme le fait le build. Commits : `feat(nui): add message bus and screen manager`, `feat(nui): add state, storage, sfx and i18n cores`.

**Phase 2 — Notify.** `ADD_NOTIFY`, `REMOVE_NOTIFY`, `ADD_DEFAULT_NOTIFIES`, `UPDATE_DEFAULT_NOTIFY`, `UPDATE_DEFAULT_NOTIFY_PROGRESS`, `REMOVE_DEFAULT_NOTIFY`. Commit : `feat(nui): rewrite notify component in vanilla js`.

**Phase 3 — TextUI + Progressbar.** `ADD_TEXT_UI_ELEMENT`, `UPDATE_TEXT_UI_ELEMENT`, `REMOVE_TEXT_UI_ELEMENT` (+ callback `textui.forceRemoveOnFailure`) ; `PROGRESS_BAR_INIT`, `PROGRESS_BAR_REMOVE` (+ `progress.onFinish`). Un commit par composant.

**Phase 4 — HelpNotify.** `ADD_HELP_NOTIFY`, `REMOVE_HELP_NOTIFY`, `UPDATE_HELP_NOTIFY_STAGE`, `UPDATE_HELP_NOTIFY_TEXT`, avec les trois variantes CSS (`basic`, `hexagon`, `diamond`).

**Phase 5 — HUD statuts.** `UPDATE_HUD_VALUE`, `SET_STATUS_VALUE`, `SET_STATUS_VISIBILITY`, `HANDLE_REGISTER_STATUS_HUD` (+ callbacks `status.onRegister`, `status.onUnregister`).

**Phase 6 — CarHUD + ceinture.** `UPDATE_CARHUD_VALUE`, `INDICATE_UNFASTEN_SEATBELT`, plus les messages carhud présents dans la map JS (`SET_CARHUD_VALUES`, `SET_CARHUD_SEATBELT`) : vérifie leur émetteur Lua réel avant implémentation.

**Phase 7 — Indicateurs.** Voice (`SET_VOICE_INDICATOR_*`), arme (`SET_WEAPON_INDICATOR_*`), street label (`SET_STREETLABEL_*`). Un commit par composant.

**Phase 8 — Chat.** `CHAT_ADD_MESSAGE`, `CHAT_ADD_SUGGESTION`, `CHAT_REMOVE_SUGGESTION`, `CHAT_SET_INPUT_VISIBLE` + callbacks `chat.*` et `chatResult`. Attention à la gestion du focus clavier et du pool de messages (`chat.poolSizeMessageRemoved`).

**Phase 9 — Menus.** Menu générique (`SET_MENU_DATA`, `SHOW_MENU`, `MENU_ON_CHANGE`, `ON_MENU_SELECT`, callback `menu.onSelect`), menu contextuel (`SET_CONTEXT_DATA`), main menu (`mainMenu.finished`), game menu (`gamemenu.handleCamera`).

**Phase 10 — Pause menu.** `SHOW_PAUSEMENU`, `UPDATE_PAUSEMENU`, `SEND_PAUSEMENU_DATA_BUTTONS` + callbacks `pauseMenu.left`, `pausemenu.disconnect`, `pausemenu.handleCamera`, `pausemenu.handleNav`. SFX de navigation (`plum`, `enter`) reproduits comme dans `HANDLE_SFX_ROUTE`.

**Phase 11 — Settings.** `SHOW_SETTINGS` et les sous-écrans `color`, `hud`, `carhud`, `notifications`, `helpNotify`, `progressBar`, `misc`, avec sauvegarde des presets (`storage.*`, `config_preset_saver.lua` côté Lua) et repositionnement des composants (`storage.onPositionUpdate`).

**Phase 12 — Welcome + musique + preview.** `INIT_WELCOME`, `HANDLE_MUSIC`, `OVERRIDE_MUSIC_STATE`, `SET_PREVIEW_VISIBILITY`, `SET_STAGGER_VISIBILITY`, callbacks `player.created`, `preview.*`, `storage.switchedScreen`.

**Phase 13 — Map + cinématique + perspective.** `HANDLE_MAP_VIEW`, `ADD_BLIP`, `SET_RADAR_SIZE`, `SET_RADAR_VISIBILITY`, callbacks `map*`, `minimap.toggle` ; `SET_CINEMATIC_*` + callbacks `cinematicMode.*` ; `SET_PERSPECTIVE_*`, `UPDATE_ROTATIONS`, `SET_PLAYER_DATA`, `SET_PLAYER_STEAM_NAME`, `SET_TOP_CONTENT_*`.

**Phase 14 — Bascule et nettoyage.** Supprime le build (`assets/index-Bs2arf7F.js`, `assets/index.css`), vérifie que `fxmanifest.lua` référence bien les nouveaux fichiers via ses globs (sans le modifier si les globs couvrent déjà `html/**`), rejoue le harnais complet, écris `README.md` (EN) et `README.fr.md` (FR) avec liens croisés de navigation. Commits : `refactor(nui): remove minified vue build`, `docs(nui): add bilingual readme`. Merge `--no-ff` dans `main`.

## 6. Validation à chaque phase

Crée `_work/harness.html` (non committé) qui charge la nouvelle UI dans un navigateur et fournit :
- un stub `window.GetParentResourceName = () => "ltl_hud"` et une interception `fetch` qui logge chaque callback posté (nom + payload) ;
- des boutons qui rejouent des messages réels : `window.postMessage({ type, data }, "*")` avec des payloads copiés depuis les appels Lua (`grep` le type dans `client/` pour construire un payload fidèle).

Critères de fin de phase : le composant réagit à tous ses types de messages, poste les bons callbacks avec les bons payloads, son rendu correspond aux classes/structure extraites du build, aucun fichier ne dépasse 300 lignes, aucune fonction 60 lignes, `_work/` absent du commit.

## 7. Annexe — contrat NUI inventorié (à re-vérifier en phase 0)

### Messages entrants (SendNUIMessage, 75 types)

ADD_BLIP, ADD_DEFAULT_NOTIFIES, ADD_HELP_NOTIFY, ADD_NOTIFY, ADD_TEXT_UI_ELEMENT, APPLY_EFFECT_ON_INTERFACE, CHAT_ADD_MESSAGE, CHAT_ADD_SUGGESTION, CHAT_REMOVE_SUGGESTION, CHAT_SET_INPUT_VISIBLE, HANDLE_BLACK_SCREEN, HANDLE_MAP_VIEW, HANDLE_MUSIC, HANDLE_REGISTER_STATUS_HUD, HANDLE_SFX_MESSAGE, INDICATE_UNFASTEN_SEATBELT, INIT_WELCOME, LOAD_UP_TRANSLATIONS, MENU_ON_CHANGE, ON_MENU_SELECT, OVERRIDE_MUSIC_STATE, PROGRESS_BAR_INIT, PROGRESS_BAR_REMOVE, REMOVE_DEFAULT_NOTIFY, REMOVE_HELP_NOTIFY, REMOVE_NOTIFY, REMOVE_STORAGE, REMOVE_TEXT_UI_ELEMENT, SEND_FULL_CFG, SEND_PAUSEMENU_DATA_BUTTONS, SEND_STORAGE, SET_CINEMATIC_FOCUS_MODE, SET_CINEMATIC_MODE_STATE, SET_COMPONENT_VISIBILITY, SET_CONTEXT_DATA, SET_MENU_DATA, SET_MINICOMPONENT_VISIBILITY, SET_PERSPECTIVE_CONTENT_VISIBILITY, SET_PERSPECTIVE_IN_VEH, SET_PLAYER_DATA, SET_PLAYER_STEAM_NAME, SET_PREVIEW_VISIBILITY, SET_RADAR_SIZE, SET_RADAR_VISIBILITY, SET_ROUTER_PATH, SET_SCREEN, SET_STAGGER_VISIBILITY, SET_STATUS_VALUE, SET_STATUS_VISIBILITY, SET_STREETLABEL_DATA, SET_STREETLABEL_VISIBILITY, SET_TOP_CONTENT_SCREEN, SET_TOP_CONTENT_VISIBILITY, SET_UI_DATA_STATUS, SET_UI_VISIBLE, SET_VOICE_INDICATOR_AS_VISIBLE, SET_VOICE_INDICATOR_DATA, SET_VOICE_INDICATOR_PLAYER_TALKING, SET_WEAPON_INDICATOR_AMMO, SET_WEAPON_INDICATOR_AS_ACTIVE, SET_WEAPON_INDICATOR_NAME, SHOW_MENU, SHOW_PAUSEMENU, SHOW_SETTINGS, UPDATE_ASPECT_RATIO, UPDATE_CARHUD_VALUE, UPDATE_DEFAULT_NOTIFY, UPDATE_DEFAULT_NOTIFY_PROGRESS, UPDATE_HELP_NOTIFY_STAGE, UPDATE_HELP_NOTIFY_TEXT, UPDATE_HUD_VALUE, UPDATE_PAUSEMENU, UPDATE_ROTATIONS, UPDATE_TEXT_UI_ELEMENT.

La map JS du build contient en plus des types non émis par ce `client/` (`SET_CARHUD_VALUES`, `SET_CARHUD_SEATBELT`, `PREVIEW_INIT`, `OBTAIN_LOCAL_DATA`, `CLEAR_CHAT`, `REMOVE_STORAGE_FULLY`) : implémente-les aussi, le bus doit rester un sur-ensemble du Lua.

### Callbacks sortants (RegisterNUICallback, 35)

base.checkNUIFocusState, base.handleFocus, base.onBodyLoaded, chat.actionButton, chat.inputVisibilityState, chat.poolSizeMessageRemoved, chatResult, cinematicMode.setFocusOff, cinematicMode.switchPreset, cinematicMode.toggleCamera, gamemenu.handleCamera, mainMenu.finished, mapChangeCoordinates, mapOffsetView, mapZOffsetView, menu.onSelect, minimap.toggle, pauseMenu.left, pausemenu.disconnect, pausemenu.handleCamera, pausemenu.handleNav, player.created, preview.end, preview.goBackToCustomize, preview.init, progress.onFinish, status.onRegister, status.onUnregister, storage.nuiRetrieve, storage.onLoad, storage.onPositionUpdate, storage.onUpdate, storage.setCreatedUI, storage.switchedScreen, textui.forceRemoveOnFailure.

### Écrans (ex-vue-router)

Racines : `/`, `/welcome` (enfants `music`, `presets`, `customize`), `/menu` (enfants `color`, `hud`, `carhud`, `notifications`, `helpNotify`, `progressBar`, `misc`), `/pausemenu`, `/mainmenu`, `/cinematic`, `/preview`, `/position`, `/transition`, `/map`, `/blank`.