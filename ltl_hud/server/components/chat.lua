-- La moitié serveur du tchat : qui peut parler, ce que dit la ligne, et sa trace
-- dans le journal d'administration.
--
-- LA SAISIE N'EST GARDÉE PAR RIEN : tout le monde l'ouvre, parce que c'est aussi
-- par là qu'on tape une commande. Le grade ne décide que de l'ÉCRITURE dans le
-- canal, et il la décide ici.
--
-- LE CLIENT NE DÉTIENT AUCUN DRAPEAU « JE SUIS STAFF » qui lui appartienne. Le
-- `canSend` qu'il reçoit à l'ouverture est recalculé depuis les grades vivants à
-- chaque appui, et il ne sert qu'à lui éviter d'envoyer dans le vide : ce n'est
-- PAS une preuve quand le message arrive. `ltl_hud:Chat:Send` revérifie, parce
-- qu'entre les deux il y a le temps que le staff a passé à écrire.
--
-- CHAQUE MESSAGE EST JOURNALISÉ, y compris ceux que le serveur refuse. Un client
-- honnête sait déjà qu'il ne peut pas écrire et n'envoie rien : une ligne refusée
-- signifie donc soit un grade tombé pendant la frappe, soit un client qui a passé
-- outre sa propre garde — l'un et l'autre étant exactement ce que cherche une
-- enquête. Les messages coupés par la limitation sont la seule exception, et elle
-- est volontaire : les journaliser laisserait à un flooder le choix du nombre de
-- lignes écrites en base.

Chat = {}

-- Les staff qui ont parlé depuis le démarrage de la ressource, par uuid public.
--
-- CET ENSEMBLE EST UNE FRONTIÈRE DE DIVULGATION, pas une optimisation. Qui est en
-- service est gardé derrière la permission `staff.list` ; relayer chaque
-- transition à tout le monde distribuerait gratuitement le registre que cette
-- permission protège. Un staff qui a posté une ligne a déjà montré son état à
-- toute la salle — garder cette ligne exacte ne révèle rien de neuf. Un staff qui
-- n'a rien écrit reste invisible.
--
-- Il ne fait que grandir, et c'est sans conséquence : il est borné par le nombre
-- de comptes staff qui parlent, tient quelques octets chacun, et un redémarrage
-- le vide.
Chat.Spoken = {}

if not Config.Chat.Use then return end

-- =============================================
-- Ressources voisines, chacune facultative
-- =============================================

-- ltl_hud ne déclare que ltl_core et pma-voice : les grades et le journal sont
-- des voisins utiles, pas des dépendances dures. Un serveur sans ltl_permissions
-- garde un tchat qui fonctionne — sans canal staff, ce qui est la direction sûre.
local function resource(name)
    return GetResourceState(name) == "started" and exports[name] or nil
end

local function permissions()
    return resource("ltl_permissions")
end

-- Les couleurs de grade, mises en cache : `Catalogue()` reconstruit tout le
-- catalogue à chaque appel, et une couleur ne change que quand un administrateur
-- édite le grade. Le cache se remplit sur défaut de clé plutôt que de s'invalider,
-- donc un grade créé après le démarrage est trouvé au premier message qui le cite.
local rankColors = {}

local function rankColor(rankId)
    if not rankId then return nil end
    if rankColors[rankId] ~= nil then
        return rankColors[rankId] or nil
    end

    local perms = permissions()
    if not perms then return nil end

    local ok, catalogue = pcall(function() return perms:Catalogue() end)
    if not ok or type(catalogue) ~= "table" or type(catalogue.ranks) ~= "table" then
        return nil
    end

    for id, rank in pairs(catalogue.ranks) do
        -- `false` et non nil : une absence de couleur doit se retenir, sinon
        -- chaque message d'un grade sans couleur reconstruit le catalogue.
        rankColors[id] = rank.color or false
    end

    return rankColors[rankId] or nil
end

AddEventHandler("ltl_permissions:ranksChanged", function()
    rankColors = {}
end)

-- =============================================
-- « Est staff », et ce que la ligne en dit
-- =============================================

---Le service d'un staff, ou nil quand PERSONNE ne le sait.
---
---`ltl_adminmenu` tient l'état (`Staff.isOnDuty`) mais ne le publie ni en export
---ni en évènement : il n'y a donc, en l'état, aucun moyen de le lire d'ici. On
---renvoie nil plutôt que `false`, et la page ne dessine alors AUCUNE pastille —
---écrire « pas en service » pour un état qu'on ignore serait exactement la
---confusion que la pastille existe pour éviter.
---
---Le jour où ltl_adminmenu expose `IsOnDuty(source)`, cette fonction le lit et la
---pastille apparaît avec ses deux états, sans rien d'autre à changer ici.
---@param src number
---@return boolean?
function Chat.DutyOf(src)
    local admin = resource("ltl_adminmenu")
    if not admin then return nil end

    local ok, onDuty = pcall(function() return admin:IsOnDuty(src) end)
    if not ok or type(onDuty) ~= "boolean" then return nil end

    return onDuty
end

---L'identité staff d'un joueur, ou nil s'il n'en est pas un.
---
---Est staff quiconque détient un grade de poids strictement supérieur à 0. Le
---poids est la seule question posée : il vit dans l'éditeur de grades, donc
---promouvoir quelqu'un suffit, sans toucher à ce fichier.
---@param src number
---@return table?
function Chat.StaffIdentity(src)
    if not Config.Chat.StaffOnly then
        -- Canal ouvert : tout le monde parle, et personne ne porte de grade. La
        -- ligne repart alors en message ordinaire, pas en ligne staff.
        return nil
    end

    local perms = permissions()
    if not perms then return nil end

    local xPlayer = LTL and LTL.GetPlayerFromId(src)
    if not xPlayer then return nil end

    local identifier = xPlayer.identifier and LTL.GetIdentifier(src)
    if not identifier then return nil end

    local ok, snapshot = pcall(function() return perms:RankSnapshot(identifier) end)
    if not ok or type(snapshot) ~= "table" or (snapshot.weight or 0) <= 0 then
        return nil
    end

    return {
        uuid = xPlayer.getUUID and xPlayer.getUUID() or nil,
        rankId = snapshot.rankId,
        rankLabel = snapshot.rankLabel,
        rankColor = rankColor(snapshot.rankId),
        name = xPlayer.getName and xPlayer.getName() or nil,
        onDuty = Chat.DutyOf(src),
    }
end

---L'heure telle qu'elle s'affichera, produite ICI et nulle part ailleurs.
---
---`os` n'existe pas dans le runtime client de FiveM : y appeler `os.date` lève
---« attempt to index a nil value (global 'os') » et fait tomber tout le
---gestionnaire. Le côté serveur est donc le seul qui puisse dater une ligne — et
---c'est de toute façon le bon côté pour une ligne diffusée, qui doit porter UNE
---heure et non celle de la machine de chaque joueur.
---@return string
function Chat.Timestamp()
    -- En 24 heures : `%I`/`%p` donnaient « 08:49PM », qui est une convention
    -- anglophone. Le reste de l'interface est en français, et le panneau de rue
    -- affiche déjà l'heure du jeu de la même façon.
    return os.date("%H:%M")
end

-- =============================================
-- Nettoyage du texte
-- =============================================

---Coupe à une frontière de codepoint.
---
---Un octet coupé au milieu d'un caractère multi-octets n'est pas de l'UTF-8
---valide, et `json.encode` refuse alors TOUT le payload plutôt que le seul
---mauvais caractère — un `sub` naïf sur un message accentué perd donc le message
---au lieu de perdre sa fin.
---@param text string
---@param limit number
---@return string
local function truncate(text, limit)
    if #text <= limit then
        return text
    end

    local cut = limit
    while cut > 0 do
        local nextByte = text:byte(cut + 1)
        -- 0x80..0xBF est un octet de continuation : tant qu'on est dessus, on est
        -- au milieu d'un caractère.
        if not nextByte or nextByte < 0x80 or nextByte > 0xBF then
            break
        end
        cut = cut - 1
    end

    return text:sub(1, cut)
end

---Ce qu'une ligne de tchat ne doit jamais porter : des caractères de contrôle —
---un retour à la ligne forgerait une deuxième ligne à l'écran et en console, un
---NUL tronque en base — et le rembourrage qu'un client ajoute pour faire passer
---un message vide pour plein. Renvoie nil pour ce qui n'a plus de contenu.
---@param text any
---@return string?
function Chat.Clean(text)
    if type(text) ~= "string" then return nil end

    text = text:gsub("%c", " "):gsub("^%s+", ""):gsub("%s+$", "")

    -- LA COUPE VIENT AVANT LE TEST DE VACUITÉ, et l'ordre est la garde :
    -- `truncate` recule jusqu'à une frontière de codepoint, donc une limite plus
    -- courte que le premier caractère donne une chaîne vide. Tester d'abord
    -- laisserait passer cette chaîne vide, ayant déjà réussi l'examen.
    text = truncate(text, Config.Chat.MaxLength)

    if text == "" then return nil end

    return text
end

-- =============================================
-- Limitation
-- =============================================

-- Consommée AVANT le nettoyage et avant le journal : un flood rejeté doit coûter
-- une recherche de table, pas une écriture.
-- Rien à relâcher au départ d'un joueur : ltl_core vide lui-même ses compteurs
-- sur `playerDropped` (server/security/ratelimit.lua), et les ids serveur étant
-- réutilisés, c'est là que ça doit se faire — une fois, pas par ressource.
local function allowed(src, lane)
    if not (LTL and LTL.RateLimit) then return true end

    local rule = Config.Chat.RateLimit[lane]
    if not rule then return true end

    return LTL.RateLimit(src, "ltl_hud:Chat:" .. lane, rule.max, rule.windowMs) == true
end

-- =============================================
-- Journal
-- =============================================

---@param src number
---@param text string
---@param delivered boolean
local function logMessage(src, text, delivered)
    local logs = resource("ltl_logs")
    if not logs then return end

    local xPlayer = LTL and LTL.GetPlayerFromId(src)

    pcall(function()
        logs:Log("chat", {
            level = delivered and "info" or "warn",
            action = "chat.message",
            label = "Message de tchat",
            result = delivered and "success" or "denied",
            source = src,
            actor = xPlayer and xPlayer.getName and xPlayer.getName() or nil,
            identifier = xPlayer and xPlayer.identifier or nil,
            -- Le message tel qu'envoyé, déjà nettoyé et coupé.
            message = text,
            delivered = delivered,
        })
    end)
end

-- =============================================
-- Suggestions de commandes
-- =============================================

---Les commandes serveur que CE joueur peut lancer.
---
---Filtrées par ACE et non par grade : l'ACE est ce qui garde réellement une
---commande console — `server.cfg` accorde `command.car` à `group.admin`, et le
---système de permissions ne les voit jamais. Une liste bâtie sur les grades
---proposerait des commandes qui refuseraient ensuite de tourner.
---
---Recalculée à chaque ouverture plutôt que mise en cache : une ressource qui
---vient de démarrer, une ACE qui vient de changer et un joueur qui vient d'être
---promu coûtent tous le même rien ici, là où un cache demanderait une
---invalidation pour chacun.
---@param src number
---@return table
local function commandsFor(src)
    local out = {}

    for _, command in ipairs(GetRegisteredCommands()) do
        if IsPlayerAceAllowed(src --[[@as string]], ("command.%s"):format(command.name)) then
            out[#out + 1] = { command = "/" .. command.name }
        end
    end

    return out
end

-- =============================================
-- Les deux évènements du canal
-- =============================================

-- LA BOÎTE S'OUVRE POUR TOUT LE MONDE, et c'est le seul comportement qui tienne :
-- la saisie est aussi ce par quoi on lance une commande, or les commandes ne sont
-- pas une affaire de staff. Refuser la boîte à un joueur, c'est lui refuser
-- `/me`, `/do` et tout ce que les autres ressources enregistrent — un prix que
-- le canal staff ne vaut pas.
--
-- Ce que le grade décide n'est donc plus l'ouverture mais l'ÉCRITURE, et c'est ce
-- que dit `canSend`. Ce drapeau est un renseignement d'affichage, pas une garde :
-- il évite au client d'envoyer un message qui sera refusé, et `ltl_hud:Chat:Send`
-- revérifie de toute façon — entre l'ouverture et l'envoi il y a le temps passé à
-- écrire, et un grade peut tomber pendant ce temps-là.
--
-- La liste de commandes voyage AVEC l'autorisation plutôt que sur son propre
-- évènement : elle n'est utile qu'à qui vient d'obtenir la boîte, et personne
-- d'autre n'a à savoir quelles commandes existent. Elle est filtrée par ACE, donc
-- un joueur ordinaire n'y voit que les siennes.
RegisterNetEvent("ltl_hud:Chat:Open", function()
    local src = source
    if not allowed(src, "open") then return end

    local canSend = not Config.Chat.StaffOnly or Chat.StaffIdentity(src) ~= nil

    TriggerClientEvent("ltl_hud:Chat:Opened", src, commandsFor(src), canSend)
end)

RegisterNetEvent("ltl_hud:Chat:Send", function(text)
    local src = source
    if not allowed(src, "send") then return end

    text = Chat.Clean(text)
    if not text then return end

    local staff = Chat.StaffIdentity(src)
    logMessage(src, text, not Config.Chat.StaffOnly or staff ~= nil)

    if Config.Chat.StaffOnly and not staff then
        -- Le grade a disparu entre l'ouverture et l'envoi. Journalisé au-dessus,
        -- puis abandonné.
        return
    end

    if staff and staff.uuid then
        Chat.Spoken[staff.uuid] = true
    end

    -- LA LIGNE PART STRUCTURÉE, pas pré-formatée. La page a besoin de la couleur
    -- du grade et de l'état de service comme CHAMPS pour les peindre ; une chaîne
    -- unique la forcerait à re-parser ce que ce côté savait déjà, et un nom
    -- portant un `[` casserait le parse.
    --
    -- L'uuid voyage comme la poignée à laquelle un changement de service sera
    -- rattaché plus tard. C'est l'uuid PUBLIC, jamais la licence.
    TriggerClientEvent("ltl_hud:Chat:StaffMessage", -1, {
        staff = staff,
        message = text,
        time = Chat.Timestamp(),
    })

    if staff then
        print(("[chat] [%s | %s] %s [%s]: %s"):format(
            tostring(staff.rankId), tostring(staff.rankLabel), staff.name or "?",
            staff.onDuty == nil and "service inconnu" or (staff.onDuty and "en service" or "pas en service"),
            text))
    end
end)

-- Un staff a pris ou rendu son service. Chaque ligne qu'il a déjà postée porte
-- une pastille, et cette pastille énonce un fait PRÉSENT — « cette personne est
-- elle responsable en ce moment » — donc elle doit suivre.
--
-- Le journal, lui, ne bouge délibérément pas : `chat.message` fige l'état au
-- moment de l'envoi, parce qu'un enregistrement qui se réécrit quand son sujet
-- change de statut n'est plus un enregistrement. L'écran suit le présent, le
-- journal garde le passé.
--
-- Évènement LOCAL et non net event : un client ne doit pas pouvoir annoncer le
-- service de quelqu'un d'autre. C'est le point d'accroche qu'une ressource de
-- service déclenche côté serveur.
AddEventHandler("ltl_hud:Chat:DutyChanged", function(uuid, onDuty)
    if type(uuid) ~= "string" or not Chat.Spoken[uuid] then return end

    TriggerClientEvent("ltl_hud:Chat:Duty", -1, uuid, onDuty == true)
end)

-- =============================================
-- API d'entrée, inchangée
-- =============================================

RegisterNetEvent('ltl_hud:Chat:MessageCreated')
AddEventHandler('ltl_hud:Chat:MessageCreated', function(icon, message, color, anonymous, proximity, header, jobWhitelisted, targetPlayer, actionButtons)
    if not allowed(source, "send") then return end

    local coords = GetEntityCoords(GetPlayerPed(source))
    local messageData = Chat.BuildMessageData(source, icon, message, color, anonymous, header, actionButtons)
    if not messageData then return end

    TriggerClientEvent('ltl_hud:Chat:RetrieveEndPointMessage', -1, messageData, coords, proximity, jobWhitelisted, targetPlayer, actionButtons)
end)

RegisterNetEvent('ltl_hud:Chat:MessageCreatedSource')
AddEventHandler('ltl_hud:Chat:MessageCreatedSource', function(icon, message, color, anonymous, proximity, header, actionButtons)
    if not allowed(source, "send") then return end

    local messageData = Chat.BuildMessageData(source, icon, message, color, anonymous, header, actionButtons)
    if not messageData then return end

    TriggerClientEvent('ltl_hud:Chat:RetrieveEndPointMessageSource', source, messageData, actionButtons)
end)

-- Écrit en un seul endroit : les deux évènements ci-dessus construisaient la même
-- charge utile à quelques lignes d'écart, ce qui est comment un nettoyage ajouté
-- d'un côté finit par manquer de l'autre.
---@return table?
function Chat.BuildMessageData(src, icon, message, color, anonymous, header, actionButtons)
    message = Chat.Clean(message)
    if not message then return nil end

    local messageData = {
        source = src,
        icon = icon,
        message = message,
        time = Chat.Timestamp(),
        IsLTLMessage = true,
        color = color or 'default',
        keyValue = _Lib.GenerateRandomString(10),
    }

    if actionButtons then
        messageData.actionButtons = {}
        for k, v in ipairs(actionButtons) do
            messageData.actionButtons[k] = { label = v.label, key = k }
        end
    end

    if not header then
        local xPlayer = LTL and LTL.GetPlayerFromId(src)
        messageData.player = anonymous and { id = src } or { name = xPlayer and xPlayer.getName() or nil }
    else
        messageData.customHeader = header
    end

    return messageData
end

ClearChat = function()
    TriggerClientEvent('ltl_hud:Chat:Clear', -1)
end

while not FrameworkSelected do
    Wait(100)
end

LTL.RegisterCommand('clear_chat', Config.CommandGroupAllowed, function(xPlayer, args)
    ClearChat()
end, true, {})
