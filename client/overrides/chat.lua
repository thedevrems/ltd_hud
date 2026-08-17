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

AddEventHandler("chat:addMessage", function(data)
    if not data.IsLTLMessage then
        return debugPrint("[^1ERROR^7] Found message that was not created from UIV2 chat, returning.")
    end
    NUI.SendMessage("CHAT_ADD_MESSAGE", data)
end)

AddEventHandler("__cfx_internal:serverPrint", function(msg)
    print(msg)
end)

AddEventHandler("__cfx_export_chat_addMessage", function()
    return
end)

AddEventHandler("chat:addSuggestion", function(command, description, params)
    local paramList = {}
    if params then
        for i, p in ipairs(params) do
            paramList[i] = { label = p.help, name = p.name:lower() }
        end
    end

    if Overrides.Chat.Commands[command] then
        debugPrint("[^2CHAT^7] Command [" .. command .. "] was already registered. Overwriting in progress.")
    end

    Overrides.Chat.Commands[command] = {
        command = command,
        params  = paramList,
        info    = description,
    }
    GlobalState.Suggestions = Overrides.Chat.Commands

    NUI.SendMessage("CHAT_ADD_SUGGESTION", Overrides.Chat.Commands[command])
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
            if Overrides.Chat.Commands[sug.name] then
                debugPrint("[^2CHAT^7] Command [" .. sug.name .. "] was already registered. Overwriting in progress.")
            end
        end

        local entry = {
            command = sug.name,
            params  = (next(builtParams)) and builtParams or {},
            info    = (sug.help and sug.help) or "",
        }
        Overrides.Chat.Commands[sug.name] = entry
        GlobalState.Suggestions = Overrides.Chat.Commands
        NUI.SendMessage("CHAT_ADD_SUGGESTION", entry)
    end

    GlobalState.Suggestions = Overrides.Chat.Commands
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

AddEventHandler("chat:clear", function() end)

Citizen.CreateThread(function()
    if GlobalState.Suggestions == nil then return end

    debugPrint("[^2CHAT^7] Found registered suggestions, restoring [/]")
    while not NUI.Loaded do Wait(1) end

    for command, entry in pairs(GlobalState.Suggestions) do
        Overrides.Chat.Commands[command] = entry
        NUI.SendMessage("CHAT_ADD_SUGGESTION", entry)
    end
    debugPrint("[^2CHAT^7] Suggestions restored!")
end)
