Threads.Chat = {}
Threads.Chat.IsInputVisible = false

function Threads.Chat.Init()
    if not Config.Chat.Use then return end
    Citizen.CreateThread(function()
        SetTextChatEnabled(false)
        SetNuiFocus(false)
    end)
end

RegisterCommand("chat_set_visible_input", function()
    if not Config.Chat.Use then return end
    if Workers.Chat.PreventInput() then return end
    NUI.SendMessage("CHAT_SET_INPUT_VISIBLE", { state = true })
    SetNuiFocus(true, true)
end)

RegisterNUICallback("chat.inputVisibilityState", function(data)
    Threads.Chat.IsInputVisible = data.state
end)

RegisterKeyMapping("chat_set_visible_input", "Shows chat input", "KEYBOARD", "T")
