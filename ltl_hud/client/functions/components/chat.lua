Chat = {}
Chat.Data = {}

Chat.CreateMessage = function(icon, message, color, anonymous, proximity, header, jobWhitelisted, targetPlayer, actionButtons)
    if not Config.Chat.Use then return end
    TriggerServerEvent('ltl_hud:Chat:MessageCreated', icon, message, color, anonymous, proximity, header, jobWhitelisted, targetPlayer, actionButtons)
end

Chat.AddMessageToPlayer = function(icon, message, color, anonymous, proximity, header, actionButtons)
    if not Config.Chat.Use then return end
    TriggerServerEvent('ltl_hud:Chat:MessageCreatedSource', icon, message, color, anonymous, proximity, header, actionButtons)
end

Chat.ClearChat = function()
    NUI.SendMessage('CLEAR_CHAT', {})
end

RegisterNUICallback('chatResult', function(data, cb)
    if not Config.Chat.Use then return end
    NUI.SendMessage('CHAT_SET_INPUT_VISIBLE', { state = false })

    local text = type(data.text) == 'string' and data.text or ''
    if text == '' then
        if cb then cb('ok') end
        return
    end

    -- Les commandes restent une affaire de client, comme toujours :
    -- ExecuteCommand passe d'abord par le registre du client, et le gestionnaire
    -- serveur décide du reste. Rien d'une commande n'appartient au chemin des
    -- messages, donc rien d'une commande ne traverse le canal ni le journal.
    if text:sub(1, 1) == '/' then
        ExecuteCommand(text:sub(2))
        if cb then cb('ok') end
        return
    end

    if Config.Chat.UseCommandsWithoutSyntax then
        ExecuteCommand(text)
    elseif Config.Chat.StaffOnly then
        -- Le canal descendant. Le serveur revérifie le grade : l'autorisation qui
        -- a ouvert la boîte ne vaut pas autorisation d'envoyer, parce qu'entre les
        -- deux il y a le temps passé à écrire.
        TriggerServerEvent('ltl_hud:Chat:Send', text)
    else
        LocalOutOfCharacter(text)
    end

    if cb then cb('ok') end
end)

-- La ligne d'un staff, reçue en CHAMPS et non pré-formatée : le serveur décide du
-- contenu, du droit de le dire et de l'heure ; cette interface décide de la puce
-- et de la clé, qui ne regardent qu'elle.
RegisterNetEvent('ltl_hud:Chat:StaffMessage')
AddEventHandler('ltl_hud:Chat:StaffMessage', function(payload)
    if not Config.Chat.Use then return end
    if type(payload) ~= 'table' or type(payload.message) ~= 'string' then return end

    NUI.SendMessage('CHAT_ADD_MESSAGE', {
        IsLTLMessage = true,
        staff = payload.staff,
        message = payload.message,
        icon = Config.Chat.Icons.staff or 'fas fa-shield-alt',
        color = 'default',
        -- L'heure vient du serveur : `os` n'existe pas dans le runtime client, et
        -- une ligne diffusée doit de toute façon porter UNE heure plutôt que
        -- celle de la machine de chaque joueur.
        time = payload.time or '',
        keyValue = 'staff_' .. _Lib.GenerateRandomString(10),
    })
end)

-- Un staff a pris ou rendu son service : chaque ligne de lui déjà à l'écran
-- repeint sa pastille, qui énonce un fait présent et non un souvenir.
RegisterNetEvent('ltl_hud:Chat:Duty')
AddEventHandler('ltl_hud:Chat:Duty', function(uuid, onDuty)
    if not Config.Chat.Use then return end
    NUI.SendMessage('CHAT_DUTY_CHANGE', { uuid = uuid, onDuty = onDuty == true })
end)

RegisterNUICallback('chat.poolSizeMessageRemoved', function(data)
    Chat.Data[data.keyValue] = nil
end)

RegisterNUICallback('chat.actionButton', function(data)
    local message = Chat.Data[data.keyValue]
    if not message then return end
    if not message.actionButtons then return end
    if not message.actionButtons[data.actionButton.key] then return end
    if not message.actionButtons[data.actionButton.key].onClick then return end
    local fnCall = message.actionButtons[data.actionButton.key].onClick
    fnCall()
end)

RegisterNetEvent('ltl_hud:Chat:Clear')
AddEventHandler('ltl_hud:Chat:Clear', function()
    Chat.ClearChat()
end)

RegisterNetEvent('ltl_hud:Chat:RetrieveEndPointMessage')
AddEventHandler('ltl_hud:Chat:RetrieveEndPointMessage', function(messageData, coords, proximity, jobWhitelisted, targetPlayer, actionButtons)
    if not Config.Chat.Use then return end

    if type(proximity) == 'number' then
        if coords then
            if #(GetEntityCoords(PlayerPedId()) - coords) > proximity then
                return
            end
        else
            return
        end
    end

    if jobWhitelisted then
        if LocalPlayer.state['UI_UserData'] then
            if LocalPlayer.state['UI_UserData'].base and LocalPlayer.state['UI_UserData'].base.job and LocalPlayer.state['UI_UserData'].base.job.name then
                if LocalPlayer.state['UI_UserData'].base.job.name ~= jobWhitelisted then
                    return
                end
            else
                return
            end
        else
            return
        end
    end

    if targetPlayer then
        if GetPlayerServerId(PlayerId()) ~= targetPlayer then return end
    end

    if messageData.icon == 'ME' or messageData.icon == 'DO' then
        TriggerEvent('ltl_hud:PlayerDUIS:Add', messageData.source, messageData.icon, messageData.message)
    end
    TriggerEvent('chat:addMessage', messageData)
    Chat.Data[messageData.keyValue] = messageData
    if actionButtons then
        Chat.Data[messageData.keyValue].actionButtons = actionButtons
    end
end)

RegisterNetEvent('ltl_hud:Chat:RetrieveEndPointMessageSource')
AddEventHandler('ltl_hud:Chat:RetrieveEndPointMessageSource', function(messageData, actionButtons)
    if not Config.Chat.Use then return end
    TriggerEvent('chat:addMessage', messageData)
    Chat.Data[messageData.keyValue] = messageData
    if actionButtons then
        Chat.Data[messageData.keyValue].actionButtons = actionButtons
    end
end)
