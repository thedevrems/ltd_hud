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

RegisterNUICallback('chatResult', function(data)
    if not Config.Chat.Use then return end
    NUI.SendMessage('CHAT_SET_INPUT_VISIBLE', {state = false})
    if Config.Chat.UseCommandsWithoutSyntax then
        if data.text:sub(1, 1) == '/' then
            return ExecuteCommand(data.text:sub(2))
        else
            ExecuteCommand(data.text)
        end
    else
        if data.text:sub(1, 1) == '/' then
            return ExecuteCommand(data.text:sub(2))
        else
            LocalOutOfCharacter(data.text)
        end
    end
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
