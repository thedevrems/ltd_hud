-- La moitié client du tchat : une touche, et aucune autorité.
--
-- OUVRIR LA BOÎTE COÛTE UN ALLER-RETOUR, volontairement. La boîte s'ouvre pour
-- tout le monde — on y tape des commandes autant que des messages — mais c'est le
-- serveur qui dit, à chaque appui, si ce joueur peut écrire dans le canal. Le
-- client ne garde donc aucun drapeau qui puisse devenir périmé : la réponse est
-- recalculée depuis les grades vivants, et une rétrogradation se voit à l'appui
-- suivant plutôt qu'à la reconnexion suivante. Le coût est d'un évènement dans
-- chaque sens, imperceptible à côté de l'attente du relâchement que ce chemin
-- avait déjà.
--
-- L'ATTENTE DU RELÂCHEMENT N'EST PAS COSMÉTIQUE : prendre le focus NUI alors que
-- la touche du tchat est encore enfoncée tape cette touche dans la boîte.

Threads.Chat = {}
Threads.Chat.IsInputVisible = false

-- Ce que le serveur a répondu à la DERNIÈRE ouverture, et rien de plus. Lu par
-- components/chat.lua pour ne pas envoyer un message d'avance perdu ; le serveur
-- revérifie à l'arrivée, donc mentir ici ne gagne rien.
Threads.Chat.CanSend = false

local awaitingGrant = false
local pendingFocus = false
local keyDown = false
local forcedHidden = false

local function takeFocus()
    pendingFocus = false
    NUI.SetFocus(true, Config.Chat.UseCursorOnInput == true)
end

-- La paire `+`/`-` plutôt qu'une commande simple : c'est elle qui donne un
-- évènement au relâchement, et le relâchement est ce qu'on attend pour prendre le
-- focus. Une commande sans `+` n'est appelée qu'à l'appui.
--
-- ⚠ Le nom a changé : un joueur qui avait réassigné `chat_set_visible_input`
-- garde une touche liée dans ses paramètres FiveM qui ne commande plus rien.
-- FiveM n'offre aucun moyen de retirer une liaison déjà enregistrée, et une
-- touche inerte vaut mieux qu'une touche qui ment.
RegisterCommand("+ltl_hud_chat", function()
    keyDown = true

    if not Config.Chat.Use then return end
    if Threads.Chat.IsInputVisible or awaitingGrant then return end
    if Workers.Chat.PreventInput() then return end

    awaitingGrant = true
    TriggerServerEvent("ltl_hud:Chat:Open")
end, false)

RegisterCommand("-ltl_hud_chat", function()
    keyDown = false

    -- LA DEMANDE MEURT AVEC LA TOUCHE. Un serveur qui ne répond pas — limitation
    -- atteinte, ressource redémarrée, tchat coupé de son côté — ne laisse aucun
    -- état derrière lui, et l'appui suivant redemande. Garder le drapeau en
    -- attendant une réponse qui ne vient pas verrouillerait la touche pour de bon.
    if not Threads.Chat.IsInputVisible then
        awaitingGrant = false
    end

    if pendingFocus then
        takeFocus()
    end
end, false)

RegisterKeyMapping("+ltl_hud_chat", "Ouvrir la saisie du tchat", "KEYBOARD", "T")

-- Le serveur a accordé la saisie. Le focus n'est PAS pris ici : la touche peut
-- être encore enfoncée, et le prendre maintenant la taperait dans la boîte.
RegisterNetEvent("ltl_hud:Chat:Opened", function(commands, canSend)
    if Threads.Chat.IsInputVisible then return end

    awaitingGrant = false
    pendingFocus = true
    Threads.Chat.CanSend = canSend == true

    -- overrides/chat.lua sort tôt quand le tchat est désactivé : la fonction
    -- n'existe alors pas, et le serveur n'envoie pas cet évènement non plus.
    if Overrides and Overrides.Chat and Overrides.Chat.SetServerSuggestions then
        Overrides.Chat.SetServerSuggestions(commands)
    end
    NUI.SendMessage("CHAT_SET_INPUT_VISIBLE", { state = true })

    -- Si la touche est déjà relevée — un appui bref, le cas courant — il n'y a
    -- rien à attendre.
    if not keyDown then
        takeFocus()
    end
end)

RegisterNUICallback("chat.inputVisibilityState", function(data, cb)
    Threads.Chat.IsInputVisible = data.state
    if not data.state then
        awaitingGrant = false
        pendingFocus = false
    end
    if cb then cb("ok") end
end)

function Threads.Chat.Init()
    if not Config.Chat.Use then return end

    CreateThread(function()
        SetTextChatEnabled(false)
        NUI.SetFocus(false, false)

        while true do
            -- Un écran fondu au noir ou le menu pause masque la fenêtre quoi que
            -- dise son minuteur : le tchat ne doit pas peindre par-dessus un
            -- écran de chargement ni par-dessus le menu échap.
            local forceHide = IsScreenFadedOut() or IsPauseMenuActive()
            if forceHide ~= forcedHidden then
                forcedHidden = forceHide
                NUI.SendMessage("CHAT_FORCE_HIDE", { hidden = forceHide })
            end

            -- Filet pour le cas où le `-` n'arrive jamais : la commande lancée
            -- depuis la console n'a pas de relâchement à attendre. On sonde à
            -- chaque frame tant qu'un focus est en attente, et au quart de
            -- seconde le reste du temps.
            if pendingFocus and not keyDown then
                takeFocus()
            end

            Wait(pendingFocus and 0 or 250)
        end
    end)
end

-- Une ressource arrêtée alors que la boîte est ouverte laisserait le joueur avec
-- le focus NUI et aucune page pour le rendre.
AddEventHandler("onResourceStop", function(resource)
    if resource == GetCurrentResourceName() then
        SetNuiFocus(false, false)
    end
end)
