-- Persistance de l'interface en base de données.
--
-- Avant, chaque réglage vivait dans le localStorage de la page NUI, c'est-à-dire
-- dans le cache FiveM du joueur : vider le cache ou changer de machine remettait
-- le HUD à zéro, et l'écran de bienvenue repartait pour un tour.
--
-- Tout est désormais rangé dans `ltl_hud_settings`, indexé par l'IDENTIFIANT DU
-- COMPTE (la licence renvoyée par LTL.GetIdentifier), pas par le personnage.
-- C'est délibéré : le joueur retrouve la même interface sur chacun de ses persos,
-- ce qui est exactement ce que fait un réglage client — il appartient à la
-- personne devant l'écran, pas au rôle qu'elle joue.

Settings = {}

-- Prêt seulement une fois la table garantie. Toute lecture avant ça renverrait
-- « aucun HUD » et relancerait l'écran de bienvenue à un joueur qui en a déjà un.
Settings.Ready = false

-- Une entrée par compte connecté : { doc = table, flushing = boolean }.
Settings.Cache = {}

-- source -> identifiant, pour vider le cache au départ du joueur sans avoir à
-- redemander l'identifiant d'une source qui n'existe plus.
Settings.Sources = {}

-- Les seules clés qu'un client peut écrire. Ce sont les noms de créneaux du
-- document (voir html/js/core/storage.js), et non les noms de composants côté
-- store : `notifies` et pas `notify`, parce que c'est la clé de stockage
-- historique et que la page continue de la produire.
Settings.Slots = {
    hud         = true,
    carhud      = true,
    notifies    = true,
    progressbar = true,
    helpnotify  = true,
    misc        = true,
    color       = true,
    music       = true,
}

-- Combien de temps on attend après une modification avant d'écrire en base.
-- Faire glisser un curseur produit une rafale d'évènements ; les regrouper évite
-- une écriture MySQL par pixel parcouru.
Settings.FlushDelay = 750

-- Garde-fous de taille. Un créneau légitime tient dans une trentaine de clés sur
-- trois niveaux ; ces bornes existent pour qu'un client bricolé ne puisse pas
-- faire grossir une ligne indéfiniment.
--
-- Comptées en nœuds plutôt qu'en octets encodés : `ltl_hud:Settings:Save` part à
-- chaque cran d'un curseur, soit plusieurs dizaines de messages par seconde pour
-- un glissement, et encoder chaque créneau juste pour le mesurer ferait payer ce
-- rythme au serveur. Le poids réel est vérifié une fois, à l'écriture groupée.
Settings.MaxSlotNodes = 512
Settings.MaxSlotDepth = 6
Settings.MaxDocumentBytes = 65536

---Le créneau tient-il dans les bornes, sans l'encoder ?
---@param value any
---@param depth number
---@param budget table compteur partagé, décrémenté à chaque nœud visité
---@return boolean
local function withinBounds(value, depth, budget)
    if depth > Settings.MaxSlotDepth then return false end

    for key, entry in pairs(value) do
        budget.left = budget.left - 1
        if budget.left < 0 then return false end

        local keyType = type(key)
        if keyType ~= "string" and keyType ~= "number" then return false end

        local entryType = type(entry)
        if entryType == "table" then
            if not withinBounds(entry, depth + 1, budget) then return false end
        elseif entryType == "function" or entryType == "userdata" or entryType == "thread" then
            return false
        end
    end

    return true
end

local function trace(msg, ...)
    if not Config.Debug then return end
    print(("^5[INTERFACE]^7 [^3SETTINGS^7] %s"):format(select("#", ...) > 0 and msg:format(...) or msg))
end

-- =============================================
-- Schéma
-- =============================================

CreateThread(function()
    while not FrameworkSelected do Wait(100) end

    local ok, err = pcall(function()
        MySQL.query.await([[
            CREATE TABLE IF NOT EXISTS `ltl_hud_settings` (
                `identifier` varchar(60) NOT NULL,
                `settings` longtext NOT NULL,
                `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                PRIMARY KEY (`identifier`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        ]])
    end)

    if not ok then
        -- Dit à voix haute : sans la table, chaque joueur repasse par l'écran de
        -- bienvenue à chaque connexion et rien n'est jamais sauvegardé. Le
        -- fichier ltl_hud.sql permet de la créer à la main.
        print("^1[ltl_hud] La table `ltl_hud_settings` n'a pas pu être créée : " .. tostring(err) .. "^7")
        print("^1[ltl_hud] Appliquez ltl_hud.sql à la main, sinon aucun réglage d'interface ne sera conservé.^7")
        return
    end

    Settings.Ready = true
    trace("^2Table `ltl_hud_settings` prête^7.")
end)

-- =============================================
-- Identité
-- =============================================

---Identifiant de compte du joueur, ou nil si la source n'est plus valable.
---@param src number
---@return string?
function Settings.IdentifierOf(src)
    if not src or src == 0 then return nil end

    local cached = Settings.Sources[src]
    if cached then return cached end

    -- shared/framework.lua laisse LTL à `false` tant que ltl_core n'a pas
    -- répondu. Indexer un booléen lèverait l'erreur AVANT le pcall, puisque
    -- l'argument est évalué en premier.
    if type(LTL) ~= "table" then return nil end

    -- LTL.GetIdentifier lève une assertion pour une source sans licence — ce qui
    -- arrive pour un joueur parti entre l'envoi de l'évènement et son traitement.
    local ok, identifier = pcall(LTL.GetIdentifier, src)
    if not ok or type(identifier) ~= "string" or identifier == "" then
        return nil
    end

    Settings.Sources[src] = identifier
    return identifier
end

-- =============================================
-- Lecture
-- =============================================

---Charge le document du compte, depuis le cache mémoire sinon depuis MySQL.
---Renvoie nil quand la base n'a pas pu être lue.
---@param identifier string
---@return table?
function Settings.Load(identifier)
    local entry = Settings.Cache[identifier]
    if entry then return entry.doc end

    local ok, stored = pcall(function()
        return MySQL.scalar.await("SELECT `settings` FROM `ltl_hud_settings` WHERE `identifier` = ?", { identifier })
    end)

    if not ok then
        -- Rien n'est mis en cache. Retenir une lecture ratée comme un document
        -- vide reviendrait à écraser la ligne du joueur à la première écriture
        -- qui suit — un HUD perdu pour une erreur MySQL passagère. L'appel
        -- suivant relira.
        trace("^1Lecture MySQL échouée pour %s : %s^7", identifier, tostring(stored))
        return nil
    end

    local doc = {}

    if type(stored) == "string" and stored ~= "" then
        local decoded, result = pcall(json.decode, stored)
        if decoded and type(result) == "table" then
            doc = result
        else
            -- Une ligne illisible repart de zéro plutôt que d'être propagée : le
            -- joueur refait l'écran de bienvenue, ce qui réécrit la ligne.
            trace("^3Document JSON illisible pour %s, réinitialisé.^7", identifier)
        end
    end

    Settings.Cache[identifier] = { doc = doc, flushing = false }
    return doc
end

-- =============================================
-- Écriture
-- =============================================

---@param identifier string
function Settings.Flush(identifier)
    local entry = Settings.Cache[identifier]
    if not entry or not entry.flushing then return end

    entry.flushing = false

    local ok, encoded = pcall(json.encode, entry.doc)
    if not ok or type(encoded) ~= "string" then
        return trace("^1Encodage JSON échoué pour %s^7", identifier)
    end

    if #encoded > Settings.MaxDocumentBytes then
        return trace("^1Document de %s trop volumineux (%d octets), écriture refusée.^7", identifier, #encoded)
    end

    local written = pcall(function()
        MySQL.query.await([[
            INSERT INTO `ltl_hud_settings` (`identifier`, `settings`) VALUES (?, ?)
            ON DUPLICATE KEY UPDATE `settings` = VALUES(`settings`)
        ]], { identifier, encoded })
    end)

    if not written then
        return trace("^1Écriture MySQL échouée pour %s^7", identifier)
    end

    trace("Sauvegardé pour %s (%d octets).", identifier, #encoded)
end

---Marque le document comme à écrire et programme la sauvegarde groupée.
---@param identifier string
local function scheduleFlush(identifier)
    local entry = Settings.Cache[identifier]
    if not entry or entry.flushing then return end

    entry.flushing = true
    SetTimeout(Settings.FlushDelay, function()
        Settings.Flush(identifier)
    end)
end

---Écrit un créneau dans le document du compte.
---@param identifier string
---@param slot string
---@param value any
---@return boolean
function Settings.Set(identifier, slot, value)
    local doc = Settings.Load(identifier)
    if not doc then return false end

    if slot == "configured" then
        if type(value) ~= "boolean" then return false end
        if doc.configured == value then return true end
        doc.configured = value
        scheduleFlush(identifier)
        return true
    end

    if not Settings.Slots[slot] or type(value) ~= "table" then return false end

    if not withinBounds(value, 1, { left = Settings.MaxSlotNodes }) then
        trace("^1Créneau %s refusé pour %s : hors des bornes de taille.^7", slot, identifier)
        return false
    end

    doc[slot] = value
    scheduleFlush(identifier)
    return true
end

-- =============================================
-- Ponts client
-- =============================================

lib.callback.register("ltl_hud:Settings:Fetch", function(source)
    local identifier = Settings.IdentifierOf(source)
    if not identifier then return nil end

    -- Court : la table est créée au démarrage de la ressource, donc seule une
    -- toute première connexion sur un serveur qui vient de booter peut attendre.
    local deadline = GetGameTimer() + 10000
    while not Settings.Ready and GetGameTimer() < deadline do Wait(100) end

    if not Settings.Ready then
        trace("^1Table indisponible, %s repart sur les préréglages du serveur.^7", identifier)
        return nil
    end

    local doc = Settings.Load(identifier)
    if not doc then
        -- La lecture a échoué. Renvoyer nil enverrait le joueur à l'écran de
        -- bienvenue alors qu'il a peut-être un HUD ; le client réessaie, et rien
        -- ne s'écrira tant que la lecture n'aura pas abouti.
        return nil
    end

    if not next(doc) then
        trace("Aucun HUD enregistré pour %s : écran de bienvenue.", identifier)
        return nil
    end

    -- Renvoyé encodé plutôt qu'en table : une table Lua vide traverse le pont
    -- NUI tantôt en `{}` tantôt en `[]`, et la page distingue les deux.
    local ok, encoded = pcall(json.encode, doc)
    if not ok then return nil end

    trace("HUD renvoyé à %s (configuré=%s).", identifier, tostring(doc.configured == true))
    return encoded
end)

RegisterNetEvent("ltl_hud:Settings:Save", function(slot, value)
    local src = source
    if type(slot) ~= "string" then return end

    local identifier = Settings.IdentifierOf(src)
    if not identifier then return end

    Settings.Set(identifier, slot, value)
end)

RegisterNetEvent("ltl_hud:Settings:Reset", function()
    local src = source

    if type(LTL) == "table" and LTL.RateLimit and not LTL.RateLimit(src, "ltl_hud:Settings:Reset", 3, 10000) then
        return
    end

    local identifier = Settings.IdentifierOf(src)
    if not identifier then return end

    Settings.Cache[identifier] = { doc = {}, flushing = false }

    pcall(function()
        MySQL.query.await("DELETE FROM `ltl_hud_settings` WHERE `identifier` = ?", { identifier })
    end)

    trace("HUD effacé pour %s.", identifier)
end)

-- =============================================
-- Cycle de vie
-- =============================================

AddEventHandler("playerDropped", function()
    local src = source
    local identifier = Settings.Sources[src]

    Settings.Sources[src] = nil
    if not identifier then return end

    -- Écrit tout de suite plutôt qu'à l'expiration du délai groupé : le joueur
    -- part, plus rien ne viendra déclencher la sauvegarde en attente.
    Settings.Flush(identifier)
    Settings.Cache[identifier] = nil
end)

AddEventHandler("onResourceStop", function(resource)
    if resource ~= GetCurrentResourceName() then return end

    for identifier in pairs(Settings.Cache) do
        Settings.Flush(identifier)
    end
end)
