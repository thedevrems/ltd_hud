NUI = {}
NUI.HandlingCam       = false
NUI.Loaded            = false
NUI.IsInterfaceDisabled = false

function NUI.SendMessage(msgType, data)
    SendNUIMessage({ type = msgType, data = data })
end

function NUI.SendAspectRatio()
    local targetAspect = 1.7777777777777777
    local screenW, screenH = GetActiveScreenResolution()
    local ratio = screenW / screenH
    NUI.SendMessage("UPDATE_ASPECT_RATIO", { ratio = targetAspect / ratio })
end

function NUI.SetFocus(hasFocus, hasCursor)
    SetNuiFocus(hasFocus, hasCursor)
end

function NUI.SetUIVisible(state)
    local wasDisabled = NUI.IsInterfaceDisabled
    debugPrint("[^2NUI^7] Setting UI visibility to state: [" .. tostring(state) .. "]")

    NUI.SendMessage("SET_UI_VISIBLE", {
        state        = state,
        radarVisible = not IsRadarHidden(),
    })
    NUI.IsInterfaceDisabled = (state == false)

    if wasDisabled and not NUI.IsInterfaceDisabled then
        if Storage.CurrentScreen == "game" then
            local inVehicle = Threads.Vehicles.Data.vehicle ~= 0
            if Config.PersistentMinimap or inVehicle then
                DisplayRadar(true)
            end
        end
    end

    if not wasDisabled and NUI.IsInterfaceDisabled then
        if Storage.CurrentScreen == "game" then
            DisplayRadar(false, true)
        end
    end
end

function NUI.SetDataLoadedStatus(state)
    local label = state and "^2LOADED^7" or "^1UNLOADED^7"
    debugPrint("[^2NUI^7] Setting UI data status to: [" .. label .. "]")
    NUI.SendMessage("SET_UI_DATA_STATUS", { state = state })
end

function NUI.SetMinicomponentVisibility(component, element, state)
    NUI.SendMessage("SET_MINICOMPONENT_VISIBILITY", {
        component = component,
        element   = element,
        state     = state,
    })
end

function NUI.SwitchScreen(screen)
    NUI.SendMessage("SET_SCREEN", { screen = screen })
end

function NUI.SendTranslations()
    NUI.SendMessage("LOAD_UP_TRANSLATIONS", Translations)
    debugPrint("[^2NUI^7] Translations has been set.")
end

function NUI.WelcomePreload()
    while not NUI.Loaded do Wait(0) end
    while not Storage.HasBeenSent do Wait(0) end
    NUI.SwitchScreen("WELCOME")
    NUI.SetFocus(true, true)
end

function NUI.SetComponentVisibility(component, state)
    local vis = state and "visible." or "not visible."
    debugPrint("[^2COMPONENTS^7] Setting visibility for component [^2" .. component:upper() .. "^7] as " .. vis)
    NUI.SendMessage("SET_COMPONENT_VISIBILITY", { component = component, state = state })
end

function NUI.SetRoutePath(path)
    NUI.SendMessage("SET_ROUTER_PATH", { path = path })
end

function NUI.SendLoadingMessage(action, data)
    SendLoadingScreenMessage(json.encode({ action = action, data = data }))
end

function NUI.ApplyEffectOnInterfaceElement(interfaceName, element, state)
    NUI.SendMessage("APPLY_EFFECT_ON_INTERFACE", {
        interface = interfaceName,
        element   = element,
        state     = state,
    })
end

RegisterNUICallback("base.checkNUIFocusState", function(data)
    local focusScreens = {
        pausemenu = true, game_menu = true, position = true,
        preview = true, welcome = true, mainmenu = true, cinematic_mode = true,
    }
    local path      = data.path
    local isFocused = IsNuiFocused()

    if focusScreens[path] and not isFocused then
        NUI.SetFocus(true, true)
        debugPrint("[^2NUI^7] [^3FOCUS_CHECK^7] Reenabling focus.")
    elseif not focusScreens[path] and isFocused then
        NUI.SetFocus(false, false)
        debugPrint("[^2NUI^7] [^3FOCUS_CHECK^7] Disabling focus.")
    else
        debugPrint("[^2NUI^7] [^3FOCUS_CHECK^7] No changes are needed.")
    end
    StopAudioScenes()
end)

RegisterNUICallback("base.handleFocus", function(data)
    NUI.SetFocus(data.state, data.state)
    GameMenu.DestroyCamera()
    PauseMenu.DestroyCam()
end)

RegisterNUICallback("base.onBodyLoaded", function()
    debugPrint("[^2NUI^7] NUI Body has been loaded.")
    NUI.Loaded = true
    Menu.SetData(AIO.Options)
end)
