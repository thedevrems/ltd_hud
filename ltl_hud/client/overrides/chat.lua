Overrides = {}
Overrides.Chat = {}
Overrides.Chat.Commands = {}

if not Config.Chat.Use then return end

RegisterNetEvent("chat:addMessage")
RegisterNetEvent("chat:addSuggestion")
RegisterNetEvent("chat:addSuggestions")
RegisterNetEvent("chat:addMode")
RegisterNetEvent("chat:removeMode")
RegisterNetEvent("chat:removeSuggestion")
RegisterNetEvent("chat:clear")
RegisterNetEvent("__cfx_internal:serverPrint")

-- L'API d'entrée de toute ressource qui annonce quelque chose aux joueurs.
--
-- Elle REFUSAIT auparavant tout message sans `IsLTLMessage`, en imprimant une
-- erreur : une ressource tierce qui déclenchait `chat:addMessage` — la façon
-- normale de parler au tchat sur FiveM — ne voyait donc jamais sa ligne, et
-- l'erreur en console la désignait comme fautive. La forme héritée est
-- désormais convertie plutôt que jetée.
--
-- La conversion passe par `player.name` et NON par `customHeader` : ce dernier
-- est rendu en balisage (`setHTML`), donc l'accepter d'une ressource tierce
-- rouvrirait exactement le trou que ltl_chat a fermé en retirant les gabarits.
-- L'heure locale de la machine, par le natif — `os` n'existe pas dans le runtime
-- client de FiveM, et l'y appeler lève « attempt to index a nil value (global
-- 'os') », ce qui fait tomber le gestionnaire entier.
--
-- Ce chemin est le seul du tchat qui ne peut PAS demander l'heure au serveur :
-- `chat:addMessage` se déclenche aussi purement côté client, sans aller-retour.
-- Tout ce qui est diffusé, lui, est daté par le serveur.
local function timestamp()
    -- En 24 heures, comme Chat.Timestamp côté serveur : `GetLocalTime` rend déjà
    -- l'heure de 0 à 23, il n'y a rien à convertir.
    local _, _, _, hour, minute = GetLocalTime()
    return ("%02d:%02d"):format(hour, minute)
end

local function normalise(data)
    if type(data) == "string" then
        data = { args = { data } }
    end

    if type(data) ~= "table" then return nil end
    if data.IsLTLMessage then return data end

    local args = type(data.args) == "table" and data.args or {}
    if #args == 0 then return nil end

    local message = {
        IsLTLMessage = true,
        icon = data.icon or "fas fa-circle-info",
        -- Le triplet rgb hérité ne teinte que l'auteur, jamais la puce : il est
        -- traité plus bas en `authorColor`.
        color = "default",
        time = timestamp(),
        keyValue = "foreign_" .. _Lib.GenerateRandomString(10),
        multiline = data.multiline == true,
    }

    -- Deux arguments ou plus : une paire auteur/corps, comme l'a toujours voulu
    -- `chat:addMessage`. Un seul : une ligne nue.
    if #args > 1 then
        message.player = { name = tostring(args[1]) }
        message.message = table.concat({ table.unpack(args, 2) }, " ")
    else
        message.message = tostring(args[1])
    end

    -- Le triplet rgb hérité de `chatMessage`, qui ne colore que l'auteur. Borné
    -- plutôt que cru : une ressource qui passe 999 ou une chaîne ne doit pas
    -- produire une déclaration de style impossible à analyser.
    if type(data.color) == "table" and #data.color >= 3 then
        local channels = {}
        for i = 1, 3 do
            local value = tonumber(data.color[i]) or 0
            channels[i] = math.max(0, math.min(255, math.floor(value + 0.5)))
        end
        message.authorColor = ("rgb(%d, %d, %d)"):format(channels[1], channels[2], channels[3])
    end

    return message
end

AddEventHandler("chat:addMessage", function(data)
    local message = normalise(data)
    if not message then
        return debugPrint("[^3CHAT^7] chat:addMessage reçu sans contenu exploitable, ignoré.")
    end
    NUI.SendMessage("CHAT_ADD_MESSAGE", message)
end)

-- Déprécié depuis la ressource Cfx.re, gardé parce que des ressources le
-- déclenchent encore. `color` est le triplet rgb hérité, qui ne colore que
-- l'auteur.
AddEventHandler("chatMessage", function(author, color, text)
    local args = { text }
    if author and author ~= "" then
        table.insert(args, 1, author)
    end
    TriggerEvent("chat:addMessage", { color = color, multiline = true, args = args })
end)

-- LE GESTIONNAIRE QUI METTAIT `refresh`, `start`, `stop` ET `restart` À L'ÉCRAN.
-- FiveM renvoie la sortie console d'une commande à celui qui l'a lancée par cet
-- évènement ; la ressource Cfx.re poussait cet écho dans le tchat en plus de la
-- console. La moitié console est conservée — un staff qui lance `restart foo` lit
-- toujours la réponse en F8, le retour n'a jamais été le problème — pendant que
-- rien du cycle de vie des ressources n'atteint le tchat de qui n'a rien demandé.
AddEventHandler("__cfx_internal:serverPrint", function(msg)
    print(msg)
end)

AddEventHandler("__cfx_export_chat_addMessage", function()
    return
end)

-- =============================================
-- Suggestions de commandes
-- =============================================

local function register(command, entry)
    if Overrides.Chat.Commands[command] then
        debugPrint("[^2CHAT^7] Command [" .. command .. "] was already registered. Overwriting in progress.")
    end
    Overrides.Chat.Commands[command] = entry
    GlobalState.Suggestions = Overrides.Chat.Commands
    NUI.SendMessage("CHAT_ADD_SUGGESTION", entry)
end

AddEventHandler("chat:addSuggestion", function(command, description, params)
    local paramList = {}
    if params then
        for i, p in ipairs(params) do
            paramList[i] = { label = p.help, name = p.name:lower() }
        end
    end

    register(command, {
        command = command,
        params  = paramList,
        info    = description,
    })
end)

AddEventHandler("chat:addSuggestions", function(suggestions)
    if not suggestions then return end

    for _, sug in next, suggestions do
        local builtParams = {}
        if sug and next(sug) and sug.params and next(sug.params) then
            for i, p in next, sug.params do
                builtParams[i] = {
                    label = (p.help and p.help) or "",
                    name  = p.name:lower(),
                }
            end
        end

        if sug.name then
            register(sug.name, {
                command = sug.name,
                params  = (next(builtParams)) and builtParams or {},
                info    = (sug.help and sug.help) or "",
            })
        end
    end
end)

AddEventHandler("chat:addMode",    function() return end)
AddEventHandler("chat:removeMode", function() return end)

AddEventHandler("chat:removeSuggestion", function(command)
    Overrides.Chat.Commands[command] = nil
    if GlobalState.Suggestions and GlobalState.Suggestions[command] then
        GlobalState.Suggestions[command] = nil
    end
    NUI.SendMessage("CHAT_REMOVE_SUGGESTION", { command = command })
end)

-- Ajoute les commandes enregistrées sur CE client à la liste envoyée par le
-- serveur. Les deux moitiés sont nécessaires et aucune ne couvre l'autre : une
-- commande serveur n'existe pas dans le registre du client, et une commande
-- client est inconnue du serveur. Les noms déjà présents l'emportent, donc
-- l'entrée serveur d'une commande enregistrée des deux côtés n'est pas doublée.
local function withLocalCommands(commands)
    commands = commands or {}

    local seen = {}
    for i = 1, #commands do
        seen[commands[i].command] = true
    end

    for _, command in ipairs(GetRegisteredCommands()) do
        local name = "/" .. command.name
        if not seen[name] and IsAceAllowed(("command.%s"):format(command.name)) then
            seen[name] = true
            commands[#commands + 1] = { command = name }
        end
    end

    return commands
end

-- Remplace la moitié de la liste qui vient du serveur, et laisse intactes les
-- entrées enregistrées par les ressources — celles-là portent l'aide et les
-- paramètres là où la moitié recalculée n'a qu'un nom, donc c'est l'entrée d'une
-- ressource qui l'emporte.
--
-- Recalculée à chaque ouverture : une commande qui vient de démarrer, une ACE qui
-- vient de changer, rien à rafraîchir et rien à reconnecter.
function Overrides.Chat.SetServerSuggestions(commands)
    NUI.SendMessage("CHAT_SET_SERVER_SUGGESTIONS", {
        suggestions = withLocalCommands(commands),
    })
end

AddEventHandler("chat:clear", function() end)

CreateThread(function()
    if GlobalState.Suggestions == nil then return end

    debugPrint("[^2CHAT^7] Found registered suggestions, restoring [/]")
    while not NUI.Loaded do Wait(1) end

    for command, entry in pairs(GlobalState.Suggestions) do
        Overrides.Chat.Commands[command] = entry
        NUI.SendMessage("CHAT_ADD_SUGGESTION", entry)
    end
    debugPrint("[^2CHAT^7] Suggestions restored!")
end)
