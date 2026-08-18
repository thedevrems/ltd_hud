Chat = {}
Chat.TimeoutsList = {}
if not Config.Chat.Use then return end
RegisterNetEvent('ltl_hud:Chat:MessageCreated')
AddEventHandler('ltl_hud:Chat:MessageCreated', function(icon, message, color, anonymous, proximity, header, jobWhitelisted, targetPlayer, actionButtons)
    if Chat.TimeoutsList[source] then
        if Chat.TimeoutsList[source].delayAmount > GetGameTimer() then
            Chat.TimeoutsList[source] = nil
        else
            return debugPrint('[^1ERROR^7] Timeout is active for player with ID ['..source..']')
        end
    end
    local coords = GetEntityCoords(GetPlayerPed(source))
    local currentTime = os.time()
    local hour12 = os.date("%I", currentTime)
    local minute = os.date("%M", currentTime)
    local ampm = os.date("%p", currentTime)
    local messageData = {
        source = source,
        icon = icon,
        message = message,
        time = string.format("%s:%s%s", hour12, minute, ampm),
        IsLTLMessage = true,
        color = color or 'default',
        keyValue = _Lib.GenerateRandomString(10),
    }
    if actionButtons then
        messageData.actionButtons = {}
        for k,v in ipairs(actionButtons) do
            messageData.actionButtons[k] = {
                label = v.label,
                key = k
            }
        end
    end
    if not header then
        messageData.player = anonymous and {
            id = source
        } or {
            name = LTL.GetPlayerFromId(source).getName()
        }
    else
        messageData.customHeader = header
    end

    TriggerClientEvent('ltl_hud:Chat:RetrieveEndPointMessage', -1, messageData, coords, proximity, jobWhitelisted, targetPlayer, actionButtons)
end)

RegisterNetEvent('ltl_hud:Chat:MessageCreatedSource')
AddEventHandler('ltl_hud:Chat:MessageCreatedSource', function(icon, message, color, anonymous, proximity, header, actionButtons)
    if Chat.TimeoutsList[source] then
        if Chat.TimeoutsList[source].delayAmount > GetGameTimer() then
            Chat.TimeoutsList[source] = nil
        else
            return debugPrint('[^1ERROR^7] Timeout is active for player with ID ['..source..']')
        end
    end
    local currentTime = os.time()
    local hour12 = os.date("%I", currentTime)
    local minute = os.date("%M", currentTime)
    local ampm = os.date("%p", currentTime)
    local messageData = {
        source = source,
        icon = icon,
        message = message,
        time = string.format("%s:%s%s", hour12, minute, ampm),
        IsLTLMessage = true,
        color = color or 'default',
        keyValue = _Lib.GenerateRandomString(10),
    }
    if actionButtons then
        messageData.actionButtons = {}
        for k,v in ipairs(actionButtons) do
            messageData.actionButtons[k] = {
                label = v.label,
                key = k
            }
        end
    end
    if not header then
        messageData.player = anonymous and {
            id = source
        } or {
            name = LTL.GetPlayerFromId(source).getName()
        }
    else
        messageData.customHeader = header
    end
    TriggerClientEvent('ltl_hud:Chat:RetrieveEndPointMessageSource', source, messageData, actionButtons)
end)

ClearChat = function()
    TriggerClientEvent('ltl_hud:Chat:Clear', -1)
end

while not FrameworkSelected do
    Wait(100)
end

LTL.RegisterCommand('clear_chat', Config.CommandGroupAllowed, function(xPlayer, args)
    ClearChat()
end, true, {})
