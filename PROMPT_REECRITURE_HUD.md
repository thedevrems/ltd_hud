# Prompt — Réécriture complète de `ltl_hud` à 0.00 ms

> **Comment s'en servir.** Ouvre Claude Code à la racine de `ltd_hud`, puis :
> `Lis @PROMPT_REECRITURE_HUD.md en entier. Exécute l'ÉTAPE 0, et rien d'autre. Arrête-toi sur les critères d'acceptation.`
> **Une étape par session.** On ne passe à la suivante que quand les critères de la précédente sont **mesurés** — par le script automatique pour ce qui est automatisable, par moi en jeu pour le reste (voir §3).

---

## 0. Contexte

Tu réécris **de zéro** la ressource FiveM `ltl_hud`. Trois dépôts :

| Chemin | Rôle |
|---|---|
| `C:\Users\guibe\OneDrive\Bureau\ltd_hud\ltl_hud` | le HUD **actuel**, à remplacer. Référence fonctionnelle, **pas** une base de départ. |
| `C:\Users\guibe\OneDrive\Bureau\ltl_exemple` | le **squelette obligatoire** de tout script LTL. Son `README.md` est le contrat de structure. À lire **en entier** avant la première ligne de code. |
| `C:\Users\guibe\OneDrive\Bureau\ltl_core` | le **framework hôte** (fork ESX rebrandé). `ensure ltl_hud` est en ligne 150 de `server.cfg`, après `pma-voice`, avant `ltl_loadingscreen`. |

**Objectif :** `0.00 ms` au `resmon` **à pied immobile** ET **au volant à vitesse stabilisée**. Mais lis le §3 avant de croire que `0.00` est une preuve.

**Tu ne portes pas l'ancien code. Tu le lis pour savoir ce que le joueur voit, puis tu écris autre chose.** L'ancien HUD fait 55 000 lignes, 30 composants, 14 threads, 47 CSS, 91 modules JS. Environ un tiers est mort. La cible est un ordre de grandeur plus petite.

### 0.1 — Contraintes de dépôt, à respecter avant le premier commit

- **Le nom du dossier `ltl_hud` est un contrat, pas une convention.** `ltl_core/server.cfg:150` fait `ensure ltl_hud` et `ltl_core/[core]/ltl_core/client/modules/hud.lua:27` fait `GetResourceState('ltl_hud')` **en dur**. Les *événements* passent par `('%s:x'):format(cache.resource)`, mais le **nom de la ressource ne change pas**.
- **Arbre propre d'abord.** `git status` montre `M ltl_hud/client/workers.lua` non commité. Commit ou stash **avant** de commencer.
- **Branche `feat/hud-v3`.** `main` garde l'ancien HUD **jusqu'à la bascule de l'étape 13**. Les deux arbres coexistent pendant la réécriture.
- **`PROMPT_nui_vanilla_rewrite.md`** à la racine documente la réécriture NUI précédente et sa contrainte d'iso-fonctionnalité. Décide de son sort à l'étape 0 (archiver dans `docs/`, ou supprimer) — il ne doit pas devenir une source de vérité contradictoire.
- **Deux dépôts, deux commits, un ordre de déploiement.** `ltl_hud` vit dans `ltd_hud/`, `server.cfg` vit dans `ltl_core/`. Tout `ensure` à ajouter (`ltl_status`, `ltl_basicneeds`, `ltl_chat`) est un commit dans **l'autre** dépôt. Le HUD doit dégrader proprement si ces ressources manquent ; `ltl_chat` doit être déployé **avant** le HUD qui l'attend.
- **`.luarc.json` n'est PAS une copie littérale.** `ltl_exemple/.luarc.json` pointe `workspace.library` sur `../ltl_core/…`, résolu depuis `Bureau/ltl_exemple`. Depuis `Bureau/ltd_hud/ltl_hud`, c'est **`../../ltl_core/[core]/ltl_core`** et **`../../ltl_core/[ox]/ox_lib/imports`**.
- **`dependency '/assetpacks'` est conservé** dans le fxmanifest cible (présent ligne 65 de l'actuel). S'il saute, `zsx_map.ytd` et `minimap.gfx` cessent d'être streamés : la minimap redevient ronde, **sans une seule erreur en console**.
- **Vérifie les noms des dépendances déclarées.** Une `dependencies {}` manquante fait **refuser le démarrage** de la ressource. `pma-voice` vit dans `ltd_hud/`, pas dans `ltl_core`. Si tu ne peux pas garantir sa présence, préfère un dégradé propre (indicateur vocal absent) à un refus de démarrage.

---

## 1. Les décisions déjà tranchées

Elles ne sont pas à rediscuter. Chacune est vérifiable dans les sources.

### 1.1 — La surface publique obligatoire, c'est **4 exports**

Le grep exhaustif de `ltl_core` ne trouve que quatre points d'appel. Les ~245 autres exports de `client/exports.lua` n'ont **aucun appelant**.

```lua
exports('Notification',      function(title, message, icon, length) end)  -- TITRE D'ABORD, title peut être nil
exports('ProgressBar',       function(icon, text, duration, onComplete, onCancel, canCancel, controlOptions, animData) end)
exports('CancelProgressBar', function() end)
exports('IsPauseMenuActive', function() end)                              -- O(1), appelé ~2×/s par ltl_inventory
```

- Le pont est `ltl_core/[core]/ltl_core/client/modules/hud.lua`. Il remplace `LTL.ShowNotification`, `ShowAdvancedNotification`, `ShowHelpNotification`, `Progressbar`, `CancelProgressbar` dès que `GetResourceState('ltl_hud') == 'started'`.
- `ltl_inventory/client.lua:2135` appelle `IsPauseMenuActive`.
- **`ltl_notify`, `ltl_progressbar` et `ltl_textui` ne doivent PAS être supprimés** : le pont relit `GetResourceState` à chaque appel et retombe dessus. C'est le filet qui fait qu'un `restart ltl_hud` ne rend pas le serveur muet.
- **`LTL.TextUI` n'est délibérément pas ponté** (raison en 6 lignes, `hud.lua:20-25`). `components/textui.lua` n'a donc aucun appelant côté framework.
- L'icône arrive **déjà résolue en FontAwesome 5**. Deux tables de mapping coexistent et **ne sont pas identiques** (`functions.lua:215-221` → `fa-info-circle` ; `hud.lua:63-68` → `fa-circle-info`). Le sprite doit couvrir **les deux jeux**, plus `fa-envelope-open`, `fa-circle-question`, `fa-hourglass-half`. **FontAwesome 5, pas 6.**
- **Élargis le grep au-delà de `ltl_core`** avant de figer : l'implémentation actuelle de `ProgressBar` accepte 11 arguments (`prop1`, `prop2`, `isAsync`), et des ressources tierces hors dépôt peuvent appeler d'autres exports. Grep `exports.ltl_hud` / `exports['ltl_hud']` sur **tous** les dossiers de ressources accessibles, et note dans `docs/INVENTAIRE.md` ce que tu n'as pas pu vérifier.

### 1.2 — Ce que le core sait déjà faire, le HUD ne le refait pas

`ltl_core/[core]/` contient déjà `ltl_notify`, `ltl_textui`, `ltl_progressbar`, `ltl_context`, `ltl_menu` (+ 3 adaptateurs), et `ltl_core/client/functions.lua:86-91` les attend nommément. `ox_target` rend `Point` et `Interaction` redondants.

**Supprimés sans remplacement** : `textui.lua`, `context_menu.lua`, `menu.lua`, `point.lua`, `interaction.lua`, et `progressbar.lua` en tant que composant autonome (il ne reste que le rendu derrière l'export).

**Le HUD garde uniquement ce que personne d'autre ne sait faire** : jauges de statut, HUD véhicule, minimap custom, indicateur d'arme, indicateur vocal 3D, street label, ceinture, bandeau joueur, menu de réglages.

### 1.3 — Le tchat est le **seul** point qui exige d'écrire du code neuf ailleurs

Vérifié : **aucune ressource de tchat n'existe** dans `[core]`, `[addons]`, `[ox]`, `[SQL]`. Et `resources_useSystemChat` est à `true` (`server.cfg:35`) pendant que le HUD détourne `chat:addMessage`, `chatMessage`, `chat:addSuggestion(s)`. Le core en dépend (`ltl_core/server/main.lua:497`), ainsi que `ltl_adminmenu`, `ox_lib`, `pma-voice`.

Abandonner le tchat sans remplacement laisse le serveur **sans tchat du tout**, y compris pour les commandes tapées avec `/`. → **Étape 12 : ressource `ltl_chat` dédiée.** Décision + date en tête du `README.md`.

### 1.4 — Réveil en **deux phases**, pas une

```
ltl:playerLoaded ──┐
                   ├─→ hydrate()  ─→ TriggerClientEvent('<res>:init')   Config + réglages + PlayerData
onResourceStart  ──┘                  page toujours sur /blank, AUCUN thread, AUCUN DisplayRadar

ltl:onPlayerSpawn ─┐
                   ├─→ reveal()   ─→ TriggerClientEvent('<res>:ready')  routage sur '/', démarrage des modules,
watchdog 15 s     ─┘                  prise du radar, welcome éventuel

ltl:playerLogout  ──→ teardown()  ─→ TriggerClientEvent('<res>:teardown')
```

- `xPlayer.spawned` est posé par `ltl_core/server/common.lua:6-7` sur `ltl:onPlayerSpawn`, **déclenché par le client** (`ltl_multicharacter/client/modules/multicharacter.lua:293-294`). Donc : `AddEventHandler`, jamais `RegisterNetEvent` ; dédupliquer ; exiger `LTL.IsPlayerLoaded(src)` ; ne s'en servir **que** pour montrer le HUD, jamais pour autoriser quoi que ce soit.
- **Watchdog obligatoire côté serveur** : `hydrate()` arme un `SetTimeout(~15000)` qui pousse `:ready` si le joueur est chargé et toujours pas spawned. Sans lui, un chemin de spawn alternatif laisse le HUD invisible pour toujours. **Le client, lui, n'attend rien dans une boucle.**
- `ltl_multicharacter` fait des **relogs sans déconnexion** (`client/main.lua:56` → `ltl:playerLogout`). Sans `:teardown`, le HUD du personnage précédent reste affiché pendant la sélection du suivant.
- `:init` doit rester **rejouable** : teardown explicite avant reconstruction (threads arrêtés, DUI détruits, timeouts annulés, page sur `/blank`). Un `:init` qui se contente de réaffecter **double chaque thread à chaque `ensure`**.
- **⚠️ MORT ET RESPAWN — piège créé par la déduplication elle-même.** Si `ltl:onPlayerSpawn` est dédupliqué par identifiant, il n'y a **pas** de second `:ready` après un respawn. Si le teardown a été déclenché à la mort, **le HUD ne revient jamais**. Tranche explicitement : ce qui reste visible pendant l'écran de mort, et par quel signal le HUD revient. La mort se détecte par `gameEventTriggered` / `CEventNetworkPlayerEntityDied` ou par `OnPlayerData` — **jamais** par `RegisterNetEvent('ltl:onPlayerDeath')` côté client, que le squelette interdit.

### 1.5 — « Client passif » contraint les **effets**, pas les **enregistrements**

`RegisterKeyMapping`, `RegisterCommand`, `exports()`, `RegisterNUICallback` et `AddStateBagChangeHandler` **doivent** s'exécuter au chargement : un keymapping enregistré après coup n'apparaît pas dans les paramètres FiveM avant un restart, et un export absent fait planter la ressource qui l'appelle.

Ce qui est interdit avant `:init`, c'est le **corps** : chaque handler commence par `if not Ready then return end`. Avant `:init` — zéro `CreateThread`, zéro `DisplayRadar`, zéro `SetNuiFocus`, zéro requête.

`ui_page` n'est pas une violation : CEF crée le navigateur au démarrage, on ne peut pas l'en empêcher. La page **boote sur `/blank`**, ne peint rien, ne demande aucun focus, n'assume aucune donnée.
**Ne jamais peindre d'écran noir maison** : le noir appartient à `ltl_multicharacter` (`DoScreenFadeOut(0)`). Deux noirs superposés = un fade-in qui ne révèle rien.

### 1.6 — Les jauges sont une **donnée**, pas une table en dur

La liste des jauges descend du serveur (`HUD:GAUGES`). **Une jauge sans fournisseur n'apparaît pas.** Ça règle d'un coup deux problèmes réels sans jamais laisser de barre figée à zéro :
- le statut `stress` **n'existe pas** (aucun `registerStatus('stress')` dans le dépôt, une seule référence orpheline dans `ltl_inventory/data/items.lua:129`) ;
- `ltl_status` et `ltl_basicneeds` **ne sont pas démarrés** (`server.cfg` a `ensure [core]` mais **aucun `ensure [addons]`**).

---

## 2. Doctrine 0.00 ms — les règles

Chaque règle est vérifiable par un `grep`, et le §3 les automatise.

**Boucles**
1. Zéro `CreateThread(function() while true do ... end end)` sans condition de sortie. → `grep -rn 'while true' client/` = 0.
2. **Une seule** boucle `Wait(0)`, dans `client/loop.lua`, pilotée par un registre **nommé** : `Loop.Acquire('seatbelt')` / `Loop.Release('seatbelt')`. `/hud:profile` peut alors dire **qui** tient la frame — « il reste une boucle » devient « seatbelt ne l'a pas relâchée ».
3. **Une seule** boucle périodique pour tout le reste, à `Wait` dynamique : 0 si un consommateur immediate-mode tourne, 100 ms en véhicule, 250 ms à pied HUD visible, 1000 ms HUD masqué ou écran fondu.
4. Un thread n'existe **que** pendant l'état qui le justifie, et il est **détruit** — pas mis en veille.
5. Aucun `while not X do Wait(0) end`. Attente = promesse (`promise.new` + `Citizen.Await`) ou `AddEventHandler` qui résout une fois. L'ancien HUD en compte **21**.
6. Tout minuteur est un `SetTimeout(duration, fn)`, jamais une boucle qui compare `GetGameTimer`.
7. **`Hud.SetVisible(raison, bool)` agrège les raisons de masquage** (`dead`, `fade`, `pauseMenu`, `clothing`, `inventory`, `welcome`, `nuiFocus`) en un booléen unique. Pas sept booléens qui se contredisent.

**Lecture d'état**
8. Interdiction de `PlayerPedId()`, `PlayerId()`, `GetVehiclePedIsIn()`, `IsPedInAnyVehicle()`, `GetSelectedPedWeapon()` dans un corps de boucle. On utilise `cache.ped`, `cache.playerId`, `cache.vehicle`, `cache.seat`, `cache.weapon` — **sans option de repli** (piège `Config.UseOxLibCache`, §4).
9. Toute bascule d'état passe par `lib.onCache('vehicle'|'weapon'|'seat', fn)`, jamais par un poll.
10. Dégâts et mort passent par `gameEventTriggered` (`CEventNetworkEntityDamage`, `CEventNetworkPlayerEntityDied`). Poll de secours santé/armure toléré à **500 ms max**, comme filet.
11. Les statuts sont **poussés** : `AddEventHandler('ltl_status:onTick')` écrit dans la file NUI. Aucune closure `get()` rappelée par une boucle.
12. Aucune touche n'est sondée. Paire `RegisterCommand('+nom')` / `('-nom')` + `RegisterKeyMapping`.
13. **Ne jamais lire `LTL.PlayerData.coords` dans une boucle** : métatable `__index` qui appelle `GetEntityCoords` à chaque accès (`ltl_core/client/modules/actions.lua:40-60`).
14. **Tout `AddStateBagChangeHandler` passe un filtre de bag en 2ᵉ argument**, jamais `nil`. Les 6 handlers actuels passent `nil` et filtrent dans le corps par comparaison de chaîne : le handler `proximity` est donc réveillé pour **chaque joueur du serveur** qui change de portée vocale.

**Pont NUI**
15. Rien n'est envoyé si la valeur n'a pas changé. `Hud.Set(key, value)` compare et sort si égal. Les nombres sont **arrondis avant comparaison** — l'utilisateur voit un entier, on ne compare pas des flottants.
16. **Batch obligatoire** : un seul `SendNUIMessage` par frame, avec toutes les clés modifiées. → `grep -c 'SendNUIMessage' client/nui.lua` = 1, `grep -rn 'SendNUIMessage' client/modules/` = 0. **Justifie ton mécanisme de flush** dans un commentaire : `SetTimeout(0)` crée une continuation par appel ; flusher en fin de la boucle périodique unique — qui existe déjà — est souvent moins cher. Garantis qu'un double armement dans la même frame ne produise qu'un message.
17. Le calcul d'affichage vit **dans le JS** : interpolation, lissage, formatage, horloge, pourcentages, animations, compteur FPS. **C'est un levier de budget Lua, pas du confort** : à 200 ms d'intervalle le compteur de vitesse reste fluide parce que la page interpole entre deux messages — le resmon baisse sans que le joueur voie une différence.
18. **Aucun DUI.** Un DUI par joueur est un navigateur par joueur : ça coûte en GPU et en mémoire CEF, **pas** en temps script.
19. **File de notifications bornée**, avec éviction de la plus ancienne. Une rafale serveur (boucle de refus d'inventaire, script tiers en erreur) empile sinon indéfiniment des nœuds DOM.
20. **Budget CEF/GPU** — ce qui coûte vraiment dans le navigateur de FiveM et que le resmon ne montre pas : `backdrop-filter`, `filter: blur`, `box-shadow` animé, `opacity` sur un conteneur **plein écran**, `will-change` permanent. L'habillage minimap actuel a un calque `blur` plein écran. Liste fermée d'exceptions, chacune justifiée.
21. **Positions en % ou en variables CSS, jamais en px.** L'ancien `core/drag.js` écrivait `left`/`top` en px, ce qui fige une position à une résolution donnée. Tester 16:9, 21:9, 4K, DPI scaling ≠ 100 %, et le passage plein écran ↔ fenêtré **en cours de partie**.

**Natives coûteuses**
22. `DisplayRadar` : seulement aux transitions, **jamais réécrit en global** (`_G.DisplayRadar = ...` interdit). Un seul fichier propriétaire, `client/modules/minimap.lua`.
23. `GetStreetNameAtCoord` : après 25 m de déplacement (comparé sur le **carré** de la distance), jamais plus d'une fois par seconde. Comparer les **hashes** avant `GetStreetNameFromHashKey`.
24. `CalculateTravelDistanceBetweenPoints` : toutes les 2 s maximum, et seulement si `IsWaypointActive()`. C'est un calcul de route.
25. `ThefeedHideThisFrame()` : pas de thread dédié. Appelé depuis la boucle unique si elle tourne déjà, sinon masquage par configuration native **une fois** au démarrage.

**Structure**
26. `fxmanifest.lua` : **aucun glob** dans `client_scripts` / `server_scripts` — l'ordre est le contrat. Les globs **sont légitimes dans `files{}`** (liste d'assets à servir, pas un ordre d'exécution) : écris-le en commentaire pour qu'on ne « corrige » pas par zèle.
27. `client/api.lua` en **dernier** : `exports('X', Fn)` capture la *valeur* de `Fn` à l'appel.
28. `shared/` ne contient **que** `locale.lua`. Aucune fonction métier, aucune config UI.
29. `config/*.lua` en **`server_scripts` uniquement**. Le client ne reçoit que `PublicConfig()`, une liste blanche explicite.

**⚠️ La contradiction à résoudre explicitement : la ceinture.**
Tu ne peux pas à la fois exiger `0.00 ms au volant` et appeler `DisableControlAction(0, 75)` chaque frame tant que la ceinture est mise. Une boucle `Wait(0)` qui appelle une native par frame **n'est pas à 0.00 ms**. Tranche, argumente dans le README, et mesure le coût réel :
- soit tu acceptes une frame tenue pendant que la ceinture est mise, tu la déclares dans la **liste fermée** des états à frame tenue (§3.4) et tu mesures son coût ;
- soit tu changes le mécanisme (bloquer la sortie autrement que par `DisableControlAction` par frame).

---

## 3. Comment tu vérifies — lis ça avant de déclarer une étape passée

### 3.1 — Ce que tu ne peux pas mesurer

**Tu ne lances pas FiveM, tu ne conduis pas, tu ne lis pas l'overlay du resmon.** Tu ne dois donc **jamais** écrire qu'une étape est validée sur un critère de jeu. Le protocole est :

1. Tu exécutes `tools/check.ps1` (§3.2) et tu colles sa sortie.
2. Tu écris **`⏸ MESURE REQUISE`** suivi de la liste **exacte** des manipulations à faire en jeu, dans l'ordre, avec la valeur attendue pour chacune.
3. **Tu t'arrêtes.** Tu ne commences pas l'étape suivante. Tu ne supposes pas le résultat.

### 3.2 — `tools/check.ps1` — livré à l'étape 1, enrichi à chaque étape

Un script unique qui exécute **tous** les greps de conformité et **sort en code d'erreur**. C'est ce que tu peux réellement vérifier toi-même, à chaque étape :

```
while true / Wait(0) hors client/loop.lua / CreateThread hors loop.lua
PlayerPedId|PlayerId|IsPedInAnyVehicle|GetVehiclePedIsIn|GetSelectedPedWeapon dans un corps de boucle
IsControlPressed|IsControlJustPressed hors de la boucle unique
SendNUIMessage hors client/nui.lua          _G.                    innerHTML|setHTML
RegisterNetEvent('ltl:  côté serveur         ltl:  côté client (hors commentaires)
AddEventHandler('ltl:playerLoaded'  → exactement 1
AddStateBagChangeHandler avec nil en 2e argument
'ltl_hud:' en dur (hors fxmanifest)          https?:// dans html/
glob dans client_scripts/server_scripts      exports( dans api.lua → ≤ 8
lib.callback côté client                     backdrop-filter|filter:\s*blur|will-change
```

### 3.3 — `0.00` n'est pas une preuve : le resmon arrondit

Le resmon affiche **deux décimales**. Un coût réel de 0.004 ms/frame s'affiche `0.00` alors qu'il représente ~0.24 ms/s. La recette exige donc **deux instruments** :

- **`resmon 1`**, 30 secondes (pas 2), dans les deux situations — à pied immobile ET au volant à vitesse stabilisée ;
- **`profiler record 500` puis `profiler view`** sur les scénarios *idle* et *conduite*, avec un budget écrit dans le README (la ressource doit être **sous le bruit** des ressources voisines connues à 0.00 ms).

**Mesure à charge, pas seulement seul et immobile.** Le budget doit tenir là où il casse : **20+ joueurs à portée**, en **ville dense**, et **à 30 FPS** — une boucle `Wait(0)` coûte deux fois plus cher **par frame** quand la frame dure 33 ms. Plus : plusieurs ressources concurrentes prenant le focus NUI.

**Budget de démarrage.** Tous les instruments ci-dessus mesurent le régime permanent. `AddReplaceTexture` + `RequestStreamedTextureDict('zsx_map')` + `SetMinimapComponentPosition` + handshake NUI + application de la config se font **au même instant** sur `:ready`. Un pic de 40 ms au spawn est invisible en régime établi et parfaitement visible à l'écran. Fixe un budget pour la première seconde.

**Budget serveur.** L'objectif 0.00 ms est client. Mais `commandsFor` fait un `IsPlayerAceAllowed` **par commande enregistrée à chaque ouverture du tchat** (~400 appels ACE sur un gros serveur), et le flush MySQL est groupé par compte. Si le tchat reste dans le périmètre : critère `resmon` côté **serveur** aussi.

**Coût CEF.** Le resmon ne voit ni les *forced reflows* ni les *style recalculations*. Le harnais `dev/harness.html` (§3.5) et le Performance panel du navigateur sont le seul moyen de les mesurer.

### 3.4 — La sortie honorable

Une étape qui rate sa cible n'est **pas** refaite indéfiniment. Après **deux** tentatives infructueuses : documente dans le README la **liste fermée** des états où une frame est tenue, avec pour chacun le coût mesuré, la raison native, et l'alternative écartée. Puis passe à l'étape suivante en le signalant. Une cible structurellement inatteignable (ceinture, `DrawSprite`, caméra de menu) qu'on assume et qu'on mesure vaut mieux qu'une boucle de correction sans fin.

### 3.5 — `dev/harness.html` — **non listé dans `files{}`**

Un harnais navigateur avec `dev/scenarios.js` (*idle / conduite / combat / reconnexion / menu*) et un débit réglable, pour itérer la NUI **sans redémarrer FiveM**. Il ne part jamais au client et ne pèse pas sur le poids de la ressource.
Critère qu'il rend mesurable, et qu'aucun autre instrument ne donne : **« le rAF s'arrête »** — scénario *idle* sans message pendant 2 s → **0 frame de scripting** au Performance panel. C'est l'équivalent, côté page, de « la boucle meurt, elle ne dort pas ».

### 3.6 — Le plan de retour arrière

Avant la bascule de l'étape 13, écris dans le README : quelle ligne de `server.cfg` change, dans quel état se trouve `ltl_hud_settings` (**les documents écrits par la v3 sont-ils lisibles par la v2 ?**), et en combien de commandes on revient à l'ancien HUD en production.

---

## 4. Pièges vérifiés — à ne surtout pas reproduire

**Bombes de performance**
- `components/pausemenu.lua:369-376` : `SetPauseMenuActive(false)` **toutes les 2 ms, pour toujours**.
- `threads/gta_components.lua:14-17` : `ThefeedHideThisFrame()` **toutes les 10 ms, à vie**. Aucune optimisation des composants ne compense ces deux-là.
- `addon/seatbelt.lua:49-52` : `DisableControlAction` dans un `Wait(3)` (~333 passes/s). La native ne vaut que pour la frame courante : `Wait(3)` l'appelle cinq fois pour rien.
- `threads/gameplay_cam.lua:22` : `for id = 1, 10000` avec `DoesCamExist` + `GetCamCoord` → jusqu'à **20 000 natives dans une frame**.
- `Config.UseOxLibCache` **n'est défini nulle part** (4 occurrences, toutes des lectures). Toutes les branches ox_lib sont mortes et le HUD repolle le ped alors qu'ox_lib est déjà en dépendance.
- Les intervalles sont **réglables par le joueur avec un minimum de 0** (`shared/config_ui.lua:66,91`) : un curseur à fond transforme les threads en `Wait(0)`. **Borne côté Lua : jamais moins de 100 ms pour le carhud, 200 ms pour les jauges**, quoi que dise la NUI. Et n'expose au joueur qu'un choix **qualitatif** (*fluide / équilibré / économe*), jamais un curseur en millisecondes. Idem `Config.Intervals.point.active = 0`.
- Le statebag `isInsideVehicle` est **écrit par le thread qui le sonde** (`threads/vehicles.lua:144`, relu l.203) : un poll déguisé en événement, qui paye en plus une sérialisation.
- `threads/hud.lua:41-47` : **un `SendNUIMessage` par statut et par tick** — 40 messages/s avec 4 statuts.
- `html/js/components/top-content.js:66` : `setInterval(shuffleSquares, 100)` lancé au chargement et **jamais arrêté** — 140 invalidations de layout par seconde, au repos.
- `core/state.js:21-27` : `emit()` notifie **tous** les abonnés sans diff. Une valeur de faim re-rend le compteur de vitesse, le chat et le slider de minimap.
- **FontAwesome est chargé en version JS** (`index.html:18`) : `MutationObserver` sur tout le document, remplaçant chaque `<i>` par un `<svg>` à l'insertion — pendant que le HUD crée des `<i>` en permanence.
- **Cinq dépendances réseau bloquent le premier rendu** : `cdn.jsdelivr.net`, `use.fontawesome.com`, deux `@import` Google Fonts **en tête** de `base.css`. Sans DNS, le HUD démarre en Times New Roman sans icônes, **sans erreur visible**.

**Sécurité — à corriger, pas à porter**
- `Player(src).state:set('UI_UserData', data, true)` : le 3ᵉ argument réplique à **tous** les clients — nom, métier, gang, liquide, banque, **argent sale** de chacun. Le filtre client est cosmétique, la donnée est déjà arrivée.
- `ltl_hud:Chat:MessageCreated` : `RegisterNetEvent` **nu**, `customHeader` rendu en `innerHTML` → **XSS NUI stockée**. Et une XSS dans cette page peut appeler `pausemenu.handleNav`, qui fait `TriggerServerEvent(eventName, params)` avec un nom d'événement **arbitraire**.
- `ltl_hud:Buckets:CreatePlayerBucket` nu : n'importe qui se rend invisible.
- **8 `RegisterNetEvent` nus, aucun `SecureNetEvent`, aucun `LTL.Validate`.**
- `server/autoinstall/install_handler.lua:23` **réécrit un fichier d'ox_lib sur le disque** via `io.open('w')`. À bannir.
- Le filtrage de proximité du `/me` est fait **côté client** : les coordonnées de l'émetteur sont envoyées à `-1`. À refaire côté serveur.

**Code mort — ne pas réécrire**
`components/carhud.lua`, `welcome.lua`, `player_dui.lua`, `vehicleCard.lua` (pointe vers `sprites/vehiclecard.html`, **qui n'existe pas**), `map.lua`, `context_menu.lua`, `interaction.lua`, `threads/interaction.lua` (`Threads.Interaction.Init()` **jamais appelé**), `threads/interaction_old.lua`, `transition.lua`, `position.lua`, `effects/focus.lua`, `data/interface.lua`, `data/user.lua`, `shared/functions/error_tracker.lua`, `cl_baseevents.lua` (9 handlers vides), `client/lib.lua` (doublon mort), `client/workers.lua` (teste 9 ressources tierces absentes et **écrase le global `lib`** à chaque appel), `client/overrides/theme/style.css` (cible `#app`, point de montage Vue disparu), tout `server/autoinstall/`.

`client/keymapping.lua` **ne fait rien** : `Config.KeyBinds` ne contient que `'seatbelt'`, les cinq `bind()` sortent sur `entry` nil. Les vraies touches sont dispersées en dur (ESCAPE `pausemenu.lua:367`, P `commands.lua:52`, T `threads/chat.lua:68`, B `seatbelt.lua:68`).

**⚠️ Mais `shared/translations/weapons.lua` n'est PAS mort** : 76 lignes de noms d'armes en français, consommées par `threads/weapons.lua:19`. **À reporter dans `shared/locale.lua`.** Vérifie de la même façon les autres fichiers de `shared/translations/` avant de les jeter en bloc.

**Fuites**
- `components/interaction.lua:124-131` : `Interaction.Remove` n'appelle **jamais** `DestroyDui`. Chaque interaction laisse un DUI 2560×1440 vivant jusqu'au restart.
- `overrides/natives/DisplayRadar.lua:17` crée **un thread par appel**.
- `Settings.Flush` remet `entry.flushing = false` **avant** le `MySQL.query.await` (`settings.lua:200` vs `212`) : deux flushs concurrents.

**Reliquats du script d'origine** (`author '.zeusx#2743'`) : `ZSX_Multicharacter`, `ZSX_Loading`, `MugShotBase64`, préfixe `zsx_map`. Le vrai multicharacter est `[core]/ltl_multicharacter` : il démarre seul et écoute `ltl:playerLoaded` — **le HUD ne doit rien initialiser**.

**Divers**
- `os` **n'existe pas** dans le runtime client FiveM. L'horodatage reste produit côté serveur.
- Le document de réglages voyage **encodé en string** vers la NUI : une table Lua vide traverse le pont tantôt en `{}` tantôt en `[]`, et la page distingue les deux.
- `LTL.GetIdentifier(src)` **lève une assertion** pour une source sans licence : toujours dans un `pcall`.
- `LTL.Validate` plafonne `table` à **128 entrées / profondeur 4** par défaut, alors que le document en autorise 512 / 6. Sans plafonds explicites, **toute sauvegarde est rejetée en silence**. → **Ouvre `ltl_core/server/security/validate.lua` et vérifie que `maxEntries` / `maxDepth` existent bien sous ces noms** avant d'écrire les schémas. Ne te fie pas au §4 du README pour ça.
- `LTL.Validate.args` échoue si un argument **en trop** est passé : le schéma est le contrat, pas un filtre.
- Un `TriggerEvent` serveur atteint **aussi** les handlers `RegisterNetEvent`, en portant le `source` ambiant.
- `lib.callback` : 2ᵉ argument = `playerId` côté **serveur**, **délai** côté client. Et `lib.callback(...)` n'enregistre rien.

---

## 5. Ce que le HUD doit consommer

| Source | Contrat exact | Piège |
|---|---|---|
| `ltl_status` | `AddEventHandler('ltl_status:onTick', data)` → `{ name, val, percent }` | **`color` et `visible` ne sont PAS dans le payload de l'événement** (seulement dans la branche `SendNUIMessage` de ltl_status). `percent` est déjà en 0-100. |
| `ltl_status` / `ltl_basicneeds` | — | **Non démarrés** : aucun `ensure [addons]`. Traité par `HUD:GAUGES` (§1.6). |
| statut `stress` | — | **N'existe pas.** Traité par `HUD:GAUGES`. |
| `ltl_inventory` | `GetPlayerWeight()` / `GetPlayerMaxWeight()` | **Aucun statebag.** Rafraîchir seulement sur ouverture/fermeture d'inventaire et sur `ltl:setPlayerData('inventory'\|'maxWeight')`. |
| `pma-voice` | statebag `proximity` (**avec filtre de bag**, règle 14) + `pma-voice:proximityChanged` | Le HUD **n'enregistre pas** de touche de portée vocale. `components/voice.lua` est le fichier le mieux écrit de l'ancien dépôt — mais son poll Mumble à 300 ms n'est armé que quand l'indicateur est visible. |
| `ltl_core` | `LTL.PlayerData`, `OnPlayerData`, `ltl:setPlayerData(key, val, current)` | **Seule** voie d'écoute côté client. |
| `ltl_clothing` | `TriggerEvent('ltl_clothing:hud', hidden)` | **Émis et écouté par personne** : le HUD reste dessiné par-dessus la cabine d'essayage. 3 lignes + l'appel symétrique à `exports.ltl_inventory:SetUiHidden(state)`. |
| menu pause | — | Le HUD remplace le menu pause : `IsPauseMenuActive()` **natif reste faux** et `ltl:pauseMenuActive` n'est **jamais** émis par le core (que `ltl_status` écoute). Le HUD doit l'émettre lui-même. |
| `ox_lib` progressbar | — | `ox_lib/…/progress.lua` n'a **pas** été routée vers le HUD (contrairement à `notify.lua`, routée à la main). **Trois barres coexistent.** Décision explicite. |
| notifications GTA natives | `html/js/components/default-notify.js` | Fonctionnalité **distincte** des notify (en-tête polymorphe, progression, persistance). Si tu la supprimes **et** que tu masques le feed natif, il n'y a plus **aucun** canal pour ce type de message. Décide, ne laisse pas disparaître. |
| `ltl_managetime`, `ltl_loadingscreen` | — | `ensure`-és mais **absents des trois dépôts**. Aucune dépendance dessus. Fin de chargement : `ltl:loadingScreenOff`. |

**Conflits de touches à arbitrer** : `ltl_progressbar` (BACK), `ltl_menu_default` (RETURN/BACK/flèches), `ltl_context` (`previewContext`), `ltl_adminmenu` (touche + staffkeys), `ox_lib` (X pour `cancelprogress`), `pma-voice` (cycle de proximité).

**Langue** : tranche entre un convar (`GetConvar('ltl:locale', 'fr')`, comme `ltl_exemple/config/config.lua:18`) et un envoi dans la charge utile de `:init` (l'ancien passait par `LOAD_UP_TRANSLATIONS` + `core/i18n.js`). Un seul mécanisme.

**Persistance — convention SQL vérifiée** : `[SQL]/migrations/` ne contient que du schéma **core**, miroirs manuels d'un runner qui n'itère que `Core.Migrations`, inatteignable depuis un satellite. `ltl_core/server/modules/settings.lua:294` le dit : « La table est créée ici plutôt que dans une migration, comme celles de ltl_logs et de **ltl_hud** ». → **Aucun fichier dans `[SQL]/migrations`.** `CREATE TABLE IF NOT EXISTS` sur `MySQL.ready` + `ltl_hud.sql` à la racine du HUD. Indexé par **identifiant de compte** (`xPlayer.identifier`), jamais par personnage ni par `playerId`.

**Migration des documents déjà en base** : fusionner sur les `DEFAULTS`, **ignorer toute clé inconnue** (`3d-mode`, noms de variantes disparus, doublons de graphie `progressbar`/`progressBar`, `helpnotify`/`helpNotify`). Si la **forme** du document change, ajoute `schema_version` — MySQL 5.7 ne connaît pas `ADD COLUMN IF NOT EXISTS`, donc `SELECT` sur `INFORMATION_SCHEMA.COLUMNS` puis `PREPARE`/`EXECUTE`/`DEALLOCATE`, comme `[SQL]/migrations/1.15.0_clothing_split_skin.sql`.

---

## 6. Architecture cible

```
ltl_hud/
├── fxmanifest.lua              contrat d'ordre — AUCUN glob dans client_scripts/server_scripts
├── .luarc.json                 globals HUD + workspace.library en ../../ (PAS une copie littérale)
├── README.md                   décisions : réveil 2 phases, réglages serveur, budget, sort du tchat,
│                               liste fermée des états à frame tenue, plan de retour arrière
├── ltl_hud.sql                 table ltl_hud_settings (le CREATE TABLE runtime reste un filet)
├── docs/
│   ├── INVENTAIRE.md           une ligne par fonctionnalité de l'ancien HUD + verdict + PREUVE
│   └── PROTOCOLE.md            table de vérité du pont NUI : ≤ 16 types, UN SEUL marqué CHAUD
├── tools/check.ps1             tous les greps de conformité, sortie en code d'erreur
├── dev/                        harness.html + scenarios.js — NON listés dans files{}
├── config/
│   ├── defaults.lua            SERVEUR SEUL. Presets d'usine
│   └── config.lua              SERVEUR SEUL. Config + PublicConfig() = liste blanche
├── shared/
│   └── locale.lua              chaînes SEULEMENT (dont les 76 noms d'armes)
├── client/
│   ├── utils.lua               helpers purs
│   ├── state.lua               Config / Settings / Ready / Spawned / Modules
│   ├── nui.lua                 pont NUI : file, batch 1 message/frame, focus, routes
│   ├── loop.lua                LES DEUX SEULES BOUCLES + Loop.Acquire/Release + /hud:profile
│   ├── modules/
│   │   ├── settings.lua        miroir + NUICallbacks + anti-rebond
│   │   ├── minimap.lua         SEUL propriétaire de DisplayRadar + street label
│   │   ├── player.lua          santé/armure/besoins/mort — event-driven
│   │   ├── vehicle.lua         thread créé sur lib.onCache('vehicle'), détruit à la sortie
│   │   ├── weapon.lua          sur lib.onCache('weapon')
│   │   ├── voice.lua           pma-voice:proximityChanged
│   │   ├── band.lua            bandeau joueur (job, gang, portefeuilles)
│   │   ├── menu.lua            page unique de réglages
│   │   └── welcome.lua         ouvert seulement si configured == false
│   ├── integrations.lua        branchements voisins, résolus UNE fois au :ready dans une table figée
│   ├── commands.lua            RegisterCommand + RegisterKeyMapping au CHARGEMENT, corps gardés
│   ├── main.lua                PASSIF : :init / :ready / :teardown
│   └── api.lua                 les 4 exports — EN DERNIER
├── server/
│   ├── utils.lua               SecureNetEvent / SecureCallback — copie littérale du squelette
│   ├── db.lua                  schéma + cache par compte + flush groupé 750 ms
│   ├── main.lua                PlayerData + points d'entrée réseau
│   └── framework.lua           SEUL fichier à écouter ltl:* — hydrate/reveal/teardown
├── html/
│   ├── index.html              boote sur /blank, ne peint rien
│   ├── icons.svg               sprite <symbol> couvrant LES DEUX jeux d'icônes du core
│   ├── css/screens/            injectées à la demande — 42 % du CSS hors du chemin critique
│   ├── js/core/                bus, store, dom, fps (le compteur FPS vit ICI)
│   └── assets/                 logo.png 1,7 Mo → WebP ; enter_welcome.wav 1,6 Mo → ogg
└── stream/                     map_timecycle_stream.xml, minimap.gfx, zsx_map.ytd
```

**Ordre `client_scripts`** : `state.lua` avant les modules ; `settings.lua` en tête des modules ; `commands.lua` après les modules ; `main.lua` après tout ; **`api.lua` en dernier**.
**Ordre `server_scripts`** : `@oxmysql/lib/MySQL.lua`, `config/defaults.lua`, `config/config.lua`, `server/utils.lua`, `server/db.lua`, `server/main.lua`, `server/framework.lua`.
**`shared_scripts`** : `@ltl_core/imports.lua` (pose `LTL`), `@ox_lib/init.lua` (pose `lib` et `cache`), `shared/locale.lua`. **Ne jamais charger `@ltl_lib` en plus** : la seconde écrase `lib`.

**NUI** : vanilla ESM, un bus unique, un `requestAnimationFrame` coalescé piloté par dirty-flags qui **s'arrête** quand rien ne change, interpolation en CSS, visibilité par `opacity`/`visibility`, **jamais par `display`**. **Un seul thème + une couleur d'accent** — ça supprime 1 523 lignes de CSS de variantes, 2 940 lignes de JS de réglages, l'écran de configuration en 5 étapes, et les composants Preview et Position qui n'existent que pour le régler.

---

## 7. Les étapes

### Étape 0 — Les deux documents, avant une ligne de code
`docs/INVENTAIRE.md` : une ligne par fonctionnalité de l'ancien HUD (30 composants + 14 threads + 6 handlers + 13 fichiers serveur), verdict **GARDÉE** (où elle atterrit) / **EXTERNALISÉE** (vers quelle ressource) / **SUPPRIMÉE** (**avec la preuve** : appelant introuvable, fichier vide, URL inexistante), plus une colonne « vérifié en jeu le ». `docs/PROTOCOLE.md` : ≤ 16 types descendants dont **exactement un** marqué CHAUD, callbacks montants énumérés. Branche `feat/hud-v3` créée, arbre propre, sort de `PROMPT_nui_vanilla_rewrite.md` décidé.
**Acceptation** — aucune fonctionnalité sans destination ; toute suppression porte sa preuve ; les 4 exports figurent avec leur signature exacte. *C'est ce document qui t'empêchera de reconduire par prudence les 250 exports et les 74 types de messages.*

### Étape 1 — Socle mort + runtime de boucles + `/hud:profile` + les 4 exports en relais
La ressource complète au sens du squelette, **sans aucune fonctionnalité**, mais **avec** son runtime de mesure. `client/loop.lua` (les deux boucles, `Loop.Acquire`/`Release` nommés), `client/nui.lua` (`Hud.Set` + flush unique), `/hud:profile`, `tools/check.ps1`. Les 4 exports **relaient vers `ltl_notify` / `ltl_progressbar`** tant que le rendu NUI n'existe pas — le serveur reste fonctionnel dès le premier commit.
**Acceptation** — `tools/check.ps1` passe. L'écran est **strictement identique** au jeu vanilla, radar natif intact. **Test du mécanisme avec un consommateur factice** : `Loop.Acquire('test')` → `/hud:profile` montre la boucle active et **qui** la tient ; `Loop.Release('test')` → elle meurt en < 1 s **et** le compteur de threads ne monte pas au cycle suivant. ⏸ `resmon` 0.00 ms + `profiler record 500`, 30 s, à pied ET au volant.

### Étape 2 — Cycle de vie : réveil deux phases, réglages en base
Client strictement passif, serveur seul propriétaire du réveil, persistance par **compte**. Supprimer `lib.callback.register('ltl_hud:Settings:Fetch')` et ses 3 relances de 5 s. `SecureNetEvent` avec plafonds **vérifiés** dans `validate.lua`. Mort/respawn tranchés (§1.4).
**Acceptation** — F8 montre `:init` puis `:ready` dans cet ordre ; la page reste sur `/blank` après `:init`. Le HUD n'apparaît **pas** pendant le multicharacter. Trois `ensure ltl_hud` d'affilée : tous les joueurs connectés reçoivent `:init` sans reconnexion, et `/hud:profile` rend les **mêmes** compteurs. Deux personnages du même compte partagent le document. Dix écritures en rafale → **une** requête.

### Étape 3 — Socle NUI : une page qui ne coûte rien tant qu'on ne lui parle pas
Le calque de jeu réduit (~15 nœuds dont 6 bougent), le bus unique, le rAF coalescé, `icons.svg`, le harnais `dev/`.
**Acceptation** — zéro requête sortante, polices et icônes affichées **DNS coupé**. `grep innerHTML|setHTML` → 0. Performance panel sur `/blank`, 60 s : activité JS ≈ 0 %. Scénario *idle* sans message pendant 2 s → **0 frame de scripting**. Scénario *conduite* à 60 msg/s : **aucun « Forced reflow »**.

### Étape 4 — Minimap, radar et street label : un seul propriétaire
`minimap.lua` devient le seul fichier appelant `DisplayRadar` ; l'override `_G.DisplayRadar` disparaît avec son thread par appel.
**Acceptation** — `grep DisplayRadar client/` → `minimap.lua` et `api.lua` uniquement ; `grep '_G\.'` → 0. Cadrage correct en 16:9, 21:9 **et 4K**. 30 s en ligne droite → 0 message street label ; une intersection → exactement 1. Waypoint retiré → 0 appel à `CalculateTravelDistance`.

### Étape 5 — Jauges : poussées, jamais sondées, et **données** par `HUD:GAUGES`
**Acceptation** — aucun `pcall` dans un corps de boucle. Injecter 2 puis 5 jauges reconstruit la liste sans casser l'ordre ; une jauge **sans fournisseur n'apparaît pas**. À pied immobile sans `ltl_status` : 0 msg/s pendant 30 s ; avec : ≤ 1 msg/s. Prendre une balle → la jauge bouge en < 250 ms.

### Étape 6 — HUD véhicule et ceinture : un thread créé à l'entrée, détruit à la sortie
**L'étape qui décide du 0.00 ms en véhicule.** Détection intégralement sur `lib.onCache('vehicle')` ; le statebag `isInsideVehicle` disparaît. **La contradiction de la ceinture est tranchée et documentée ici** (§2, fin).
**Acceptation** — à pied, `/hud:profile` ne liste **aucune** boucle véhicule — pas dormante : **absente**. `/hud:profile` en roulant : < 5 msg/s stabilisé, < 20 msg/s en accélération. **20 entrées/sorties de véhicule → le compteur de threads cumulés a monté de 20 EXACTEMENT, ni plus ni moins**, et le nombre de boucles actives est identique au départ. ⏸ `resmon` + `profiler` au volant.

### Étape 7 — Indicateur d'arme et indicateur vocal 3D
`lib.onCache('weapon')` + paire `+aim`/`-aim`. Poll Mumble armé seulement quand l'indicateur est visible. Statebag `proximity` **avec filtre de bag**.
**Acceptation** — arme rangée, immobile : 0 msg/s pendant 30 s, aucune boucle active. Viser 10 s → ≤ 2 messages. Un autre joueur change de portée vocale → **notre handler ne se réveille pas**.

### Étape 8 — Bandeau joueur : fin de la fuite de données
**Acceptation** — depuis un **second** client : `Player(<id du premier>).state.UI_UserData` → `nil`. `grep "state:set(.*, true)" server/` → 0. `grep TriggerServerEvent client/main.lua` → 0 au chargement.

### Étape 9 — Contrat core : notifications, barre de progression, menu pause, voisins
Basculer les 4 exports vers le rendu réel. Brancher `IsPauseMenuActive()` en O(1), l'émission de `ltl:pauseMenuActive`, `ltl_clothing:hud`, `ltl_inventory:SetUiHidden` — dans `client/integrations.lua`.
**Acceptation** — `Notification(nil, 'sans titre', ...)` → **pas de bande d'en-tête vide**. Barre de 8 s → **2 messages au total** (init + fin), 0 msg/s entre les deux, `resmon` à 0.00 ms pendant toute sa durée. `stop ltl_hud` → la notification suivante passe par `ltl_notify`. Cabine d'essayage → HUD **et** hotbar disparaissent. File de notifications bornée : 50 notifications en rafale n'empilent pas 50 nœuds.

### Étape 10 — Écran de réglages et première configuration
Fusionner mainmenu (355 l., 6 threads), pausemenu (393 l., 9 threads), gamemenu et menu AIO en **une** page. Écrans et CSS chargés par `import()` dynamique.
**Acceptation** — `grep SetPauseMenuActive client/` → aucune boucle. `resmon` menu fermé : 0.00 ms ; ouvert : pic **borné et documenté** qui retombe dans la seconde. Ouvrir/fermer 20 fois → même cumul de threads, focus NUI rendu à chaque fois. Curseur d'un bout à l'autre → rendu immédiat (optimiste) et **au plus 1** `TriggerServerEvent`.

### Étape 11 — Tchat : externaliser dans `ltl_chat`
**Acceptation** — `TriggerServerEvent('ltl_chat:…MessageCreated', …)` depuis la console d'un client → aucun effet. `customHeader` contenant `<img src=x onerror=alert(1)>` → affiché **échappé**. Un `/me` émis à 100 m **n'arrive pas** au client hors de portée — vérifié dans les **logs réseau**, pas seulement à l'écran. Suggestions filtrées par ACE. Commande inconnue → message d'erreur du core toujours émis.

### Étape 12 — Mesure à charge et budgets non-clients
Serveur peuplé, ville dense, 30 FPS. Budget de démarrage. Budget serveur. Budget CEF.
**Acceptation** — 20+ joueurs à portée : `resmon` et `profiler` tiennent. Pic de `:ready` sous le budget écrit au README. `resmon` **serveur** sous son budget. Aucun *forced reflow* au Performance panel sur les 5 scénarios.

### Étape 13 — Bascule, purge et recette finale
Supprimer l'ancien arbre, geler la surface publique, écrire le plan de retour arrière.
**Acceptation** — **M1** `resmon 1` + `profiler`, 30 s : 0.00 ms à pied ET au volant. **M2** chaque boucle de `/hud:profile` a un compteur qu'on sait expliquer. **M3** débit NUI 0 / <5 / <20 msg/s. **M4** 0 DUI vivant ; cumul de `CreateThread` stable après 20 entrées/sorties de véhicule, 20 ouvertures/fermetures de menu, une visée. **M5** trois `ensure` d'affilée sans thread doublé. **M6** chaque ligne GARDÉE de `docs/INVENTAIRE.md` cochée « vérifié en jeu le ». **M7** retour arrière testé pour de vrai.

---

## 8. Règles de travail

- **Une étape par session.** Tu ne commences pas la N+1 dans la même passe que la N.
- **Tu ne portes pas de code sans avoir trouvé son appelant.** L'ancien HUD charge 118 lignes de threads dont l'`Init()` n'est jamais appelé.
- **Tu ne déclares jamais validé un critère que tu ne peux pas mesurer** (§3.1). Tu écris `⏸ MESURE REQUISE` et tu t'arrêtes.
- Tous les noms d'événements passent par `('%s:xxx'):format(cache.resource)` — mais le **nom de la ressource** reste `ltl_hud` (§0.1).
- Chaque export répond un **défaut inoffensif** tant que `not Ready`, jamais une erreur. Une ressource tierce qui interroge le HUD pendant le multicharacter est le cas **normal**.
- Les `RegisterNUICallback` n'ont pas besoin de `SecureNetEvent` (canal local), mais le Lua **normalise avant de relayer au réseau** : slot en liste blanche, clés connues, nombres bornés, chaînes tronquées. Sinon le pont NUI devient un contournement propre de la garde réseau.
- **Anti-rebond côté client, jamais côté serveur.** Coalescer avec `SetTimeout(~250 ms)` **et flusher au relâchement du contrôle**, puis un seul `TriggerServerEvent`. Sans ça, le rate limit jette la majorité des messages — et le dernier, le seul qui compte, peut être un des jetés : le réglage « ne tient pas », sans la moindre erreur.
- **Commits** : Conventional Commits avec le chemin en scope — `feat(ltl_hud/client/modules/vehicle): démarre le thread sur cache.vehicle`. **Aucune mention d'IA, aucun trailer `Co-Authored-By`.**
