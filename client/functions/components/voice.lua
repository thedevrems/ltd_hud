Voice = {}
Voice.Visibility = false

function Voice.Init(enable, screenName)
    if Config.UI.DisableVoiceIndicator then return end

    if not Config.UI.Use3DVoiceIndicator then
        if not enable and screenName then
            if TopContent.CurrentScreen ~= screenName then return end
        end
        NUI.SendMessage("SET_TOP_CONTENT_VISIBILITY", { state = enable })
    else
        NUI.SendMessage("SET_VOICE_INDICATOR_AS_VISIBLE", { state = enable })
    end
end

function Voice.SetData(data)
    NUI.SendMessage("SET_VOICE_INDICATOR_DATA", data)
end

function Voice.Flash()
    if Voice.Visibility then return end
    Citizen.CreateThread(function()
        Voice.Visibility = true
        Voice.Init(true, "proximity")
        Wait(3000)
        Voice.Init(false, "proximity")
        Voice.Visibility = false
    end)
end

AddStateBagChangeHandler("proximity", nil, function(bag, key, value)
    if bag ~= ("player:%s"):format(GetPlayerServerId(PlayerId())) then return end
    if type(value) ~= "table" or not value.mode then return end

    TopContent.SetScreen("proximity")
    Voice.SetData({
        value = Config.Voice.NameToProgress[value.mode] or Config.Voice.DefaultProgress,
        label = value.mode,
    })

    Voice.Flash()
end)

TopContent = {}
TopContent.CurrentScreen = ""

function TopContent.SetScreen(screenName)
    if TopContent.CurrentScreen == screenName then return end
    TopContent.CurrentScreen = screenName
    NUI.SendMessage("SET_TOP_CONTENT_SCREEN", { name = screenName })
end

function TopContent.Init(state)
    NUI.SendMessage("SET_TOP_CONTENT_VISIBILITY", { state = state })
end
