Notify = {}

function Notify.Add(header, text, icon, duration)
    if not Config.Notify.Use then return end

    if not NUI.Loaded then
        while not NUI.Loaded and Storage.CurrentScreen ~= "game" do Wait(0) end
    end

    local displayHeader = (InputParser and InputParser.ParseInputs and InputParser.ParseInputs(header)) or header
    local displayText   = (InputParser and InputParser.ParseInputs and InputParser.ParseInputs(text))   or text

    local serial = "notify_" .. _Lib.GenerateRandomString(10)

    NUI.SendMessage("ADD_NOTIFY", {
        header   = displayHeader,
        text     = displayText,
        icon     = icon,
        duration = duration or 5000,
        serial   = serial,
    })

    Citizen.CreateThread(function()
        Wait(100)
        NUI.SendMessage("HANDLE_SFX_MESSAGE", { sfx = "notify_enter" })
    end)

    return serial
end

RegisterCommand("addnotify", function()
    Notify.Add("Test", "Press ~INPUT_ENTER~ to interact and ~INPUT_SPRINT~ to run!", "fas fa-envelope-open", 12000)
end)

function Notify.Remove(serial)
    if not serial then
        return debugPrint("[^1ERROR^7] You need send proper serial in order to remove described notify.")
    end
    NUI.SendMessage("REMOVE_NOTIFY", { serial = serial })
end
