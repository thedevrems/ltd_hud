Storage = {}
Storage.HasBeenSent  = false
Storage.CurrentScreen = ""
Storage.Data          = {}

Storage.UITypes = {
    hud         = true,
    carhud      = true,
    notifies    = true,
    helpnotify  = true,
    progressbar = true,
    minimap     = true,
    color       = true,
    progressBar = true,
    misc        = true,
}

function Storage.SetCurrentScreen(path)
    Storage.CurrentScreen = path
end

function Storage.OnScreenSwitched(newPath)
    local prevPath = Storage.CurrentScreen

    TriggerEvent("ltl_hud:Storage:OnScreenSwitched", prevPath, newPath)
    NUI.SendMessage("INDICATE_UNFASTEN_SEATBELT", { state = false })

    if prevPath == "position" then
        DisplayRadar(false, true)
    end

    if newPath == "game" then
        NUI.SetFocus(false, false)
        MusicPlayer.HandleVolume("STOP")
        if Config.PersistentMinimap then
            if not NUI.IsInterfaceDisabled then
                if LocalPlayer.state.UI_DataLoaded then
                    DisplayRadar(true)
                    if Config.PersistentStreetLabel then
                        StreetLabel.SetVisible(true)
                    end
                end
            end
        elseif prevPath == "pausemenu" then

            if not NUI.IsInterfaceDisabled and LocalPlayer.state.UI_DataLoaded then
                if Threads.Vehicles.Data.vehicle ~= 0 then
                    DisplayRadar(true)
                end
            end
        end
    end

    if prevPath == "game" then
        MusicPlayer.HandleVolume("START")
        Menu.ForceClose()
    end

    if prevPath == "position" or prevPath == "preview" then
        if not Config.PersistentMinimap then
            local isRadarVisible = not IsRadarHidden()
            if Threads.Vehicles.IsRadarVisible ~= isRadarVisible then
                DisplayRadar(false, true)
                NUI.SendMessage("SET_PERSPECTIVE_IN_VEH", { state = false })
                StreetLabel.SetVisible(false)
            end
        end
    end
end

RegisterNUICallback("storage.switchedScreen", function(data, cb)
    local prevScreen = Storage.CurrentScreen
    Storage.OnScreenSwitched(data.path)
    Storage.CurrentScreen = data.path

    if prevScreen ~= data.path then
        Debug.Print("SCREENS", "^3%s^7 -> ^3%s^7", tostring(prevScreen):upper(), tostring(data.path):upper())
    end
    if cb then cb("ok") end
end)

RegisterNUICallback("storage.setCreatedUI", function(_, cb)
    Debug.Print("PRESETS", "^2storage.setCreatedUI received^7 — the NUI finished the welcome flow.")
    Storage.SetUIAsCreated()
    if cb then cb("ok") end
end)

function Storage.SetUIAsCreated()
    if Storage.Data.createdUI then
        return Debug.Print("PRESETS", "SetUIAsCreated called again, already done — ignoring.")
    end

    Debug.Print("PRESETS", "Marking the UI as created [/]")
    Storage.Data.createdUI = true

    -- Anything that throws here leaves the threads in _init.lua half-started,
    -- which looks exactly like "the hud never appeared".
    local ok, err = pcall(function()
        Minimap.Prepare("Basic")
        SetBlipAlpha(GetNorthRadarBlip(), 0)
        SetRadarBigmapEnabled(false, false)
        Threads.FPSCount.Init()
    end)

    if not ok then
        return Debug.Print("PRESETS", "^1SetUIAsCreated failed: %s^7", tostring(err))
    end

    Debug.Print("PRESETS", "^2UI marked as created^7 — hud threads in _init.lua are released.")
    Debug.Print("PRESETS", "Visibility gate: UI_DataLoaded=%s (false = hud layers stay invisible)",
        Debug.Bool(LocalPlayer.state.UI_DataLoaded))
end

function Storage.GetCurrentScreen()
    return Storage.CurrentScreen
end

function Storage.IsInPauseMenu()
    return Storage.CurrentScreen == "pausemenu"
end

function Storage.Update(uiType, key, value)
    if not (uiType and Storage.UITypes[uiType]) then
        local label = uiType or "NOT_GIVEN"
        return debugPrint("[^1ERROR^7] Could not find UI Type. UI_TYPE/ERROR_CODE " .. label)
    end

end

function Storage.Send(uiType, key, value)
    if not (uiType and Storage.UITypes[uiType]) then
        local label = uiType or "NOT_GIVEN"
        return debugPrint("[^1ERROR^7] Could not find UI Type. UI_TYPE/ERROR_CODE " .. label)
    end
    NUI.SendMessage("SEND_STORAGE", { ui = uiType, key = key, value = value })
end

function Storage.Remove()
    NUI.SendMessage("REMOVE_STORAGE", {})
    debugPrint("[^3STORAGE^7] Removed saved storage data.")
end

function Storage.HandleConfig()

    if Config.UseOptimalValues then
        Config.UsePerspective = false
    end

    local perspectiveOk = Config.UsePerspective and Config.UI.Use3DContent
    if not perspectiveOk then
        local disabledLabel = (not Config.UsePerspective) and "Config.UsePerspective"
                              or ((not Config.UI.Use3DContent) and "Config.UI.Use3DContent")
                              or "Unknown"
        debugPrint("[^3STORAGE^7] [^1" .. disabledLabel .. "^7] Is set to false. Disabling other 3d perspective components [/]")

        if Config.UsePerspective then
            debugPrint("[^3STORAGE^7] [^1Config.UsePerspective^7] Disabling [/]")
            Config.UsePerspective = false
        end
        if Config.UI.Use3DContent then
            debugPrint("[^3STORAGE^7] [^1Config.UI.Use3DContent^7] Disabling [/]")
            Config.UI.Use3DContent = false
        end
        if Config.UI.Use3DVoiceIndicator then
            debugPrint("[^3STORAGE^7] [^1Config.UI.Use3DVoiceIndicator^7] Disabling [/]")
            Config.UI.Use3DVoiceIndicator = false
        end
        if Config.UI.WeaponIndicatorMode == "3d" then
            debugPrint("[^3STORAGE^7] [^1Config.UI.WeaponIndicatorMode^7] Setting as non 3D [/]")
            Config.UI.WeaponIndicatorMode = "non-3d"
        end
        debugPrint("[^3STORAGE^7] [^1" .. disabledLabel .. "^7] Forced all components to non 3d directive.")
    end

    if Config.UI.UseMusic then
        debugPrint("[^3STORAGE^7] [^1Config.UI.UseMusic^7] Disabling music component due to the YouTube API contains memory leak.")
        Config.UI.UseMusic = false
    end
end

function Storage.SendFullCFG()
    Storage.HandleConfig()

    for name, entry in pairs(Config.Hud.Status) do
        Config.Hud.Status[name] = {
            name      = entry.name,
            icon      = entry.icon,
            value     = entry.value,
            isVisible = entry.isVisible,
        }
    end

    NUI.SendMessage("SEND_FULL_CFG", { config = Config })
    NUI.SendAspectRatio()
end

RegisterCommand("dumpStorage", function()
    print(json.encode(Storage.Data))
end)

function Storage.Prepare(callback)
    debugPrint("[^2NUI^7] Sending data [/]")
    Config.IsMulticharacterStarted = (GetResourceState("ZSX_Multicharacter") == "started")
    Storage.SendFullCFG()

    while not Storage.HasBeenSent do Wait(50) end
    debugPrint("[^2NUI^7] Received Config data")

    NUI.SendMessage("SEND_PAUSEMENU_DATA_BUTTONS", {
        buttons        = Config.PauseMenu.Buttons,
        useCustomOrder = Config.PauseMenu.UseCustomOrder,
        order          = Config.PauseMenu.Order,
    })
    debugPrint("[^2NUI^7] Updated Pause Menu buttons.")

    if callback then callback() end
end

RegisterNUICallback("storage.onLoad", function(data, cb)
    Storage.Data = data
    Storage.HasBeenSent = true
    Threads.Vehicles.RefreshInterval = data.carhud.refreshInterval

    -- UIConfigured decides whether the welcome flow runs at all this session.
    Debug.Print("STORAGE", "^2Storage preloaded^7 from the NUI (UIConfigured=%s, hud=^3%s^7)",
        Debug.Bool(data.UIConfigured), tostring(data.hud and data.hud.selected))

    TriggerEvent("ltl_hud:Storage:Set", data)
    if cb then cb("ok") end
end)

function Storage.SetData(data)
    Storage.Data = data
end

function Storage.GetLocalData()

end

RegisterNUICallback("storage.nuiRetrieve", function(data)
    debugPrint("[^5CB^7] Gathered storage from LocalStorage.")
    Storage.SetData(data)
end)

function Storage.Updated(uiType, newData)
    if not Storage.UITypes[uiType] then
        return debugPrint("Attempt to update nil component: " .. uiType)
    end
    Storage.Data[uiType] = newData

    if uiType == "color" then
        Storage.OnColorChange()
    elseif uiType == "carhud" then
        Threads.Vehicles.RefreshInterval = newData.refreshInterval
    elseif uiType == "hud" then
        Threads.Hud.RefreshInterval = newData.refreshInterval
    end

    TriggerEvent("ltl_hud:Storage:Updated", uiType, newData)
    debugPrint(string.format("[^5CB^7] Component ^3[%s]^7 has been updated.", uiType:upper()))
end

RegisterNUICallback("storage.onUpdate", function(data)
    debugPrint("[^5CB^7] Storage for component ^3[" .. data.component:upper() .. "]^7 has been updated. Retrieving values [/]")
    Storage.Updated(data.component, data.componentData)
end)

RegisterNUICallback("storage.onPositionUpdate", function(data)
    TriggerEvent("ltl_hud:Storage:OnPositionUpdate", data.component, data.position, data.width, data.height)
end)

function Storage.GetHudColor(asRGB)
    if asRGB then
        local hex = Storage.Data.color.primaryColor:gsub("#", "")
        return {
            r = tonumber("0x" .. hex:sub(1, 2)),
            g = tonumber("0x" .. hex:sub(3, 4)),
            b = tonumber("0x" .. hex:sub(5, 6)),
        }
    end
    return Storage.Data.color.primaryColor
end

function Storage.OnColorChange()
    local rgb = Storage.GetHudColor(true)
    ReplaceHudColourWithRgba(116, rgb.r, rgb.g, rgb.b, 255)
    Point.UpdateColor(Storage.GetHudColor())
    TriggerEvent("ltl_hud:Storage:OnColorUpdate", rgb, Storage.GetHudColor())
end

function Storage.GetElementData(uiType, key)
    if not Storage.Data[uiType] then
        return debugPrint("[^1ERROR^7] Could not find UI Type. UI: " .. (uiType or "NOT_GIVEN"))
    end
    if key then
        if not Storage.Data[uiType][key] then
            return debugPrint("[^1ERROR^7] Could not find key for " .. uiType .. ". Key: " .. (key or "NOT_GIVEN"))
        end
        return Storage.Data[uiType][key]
    end
    return Storage.Data[uiType]
end

Citizen.CreateThread(function()
    while not NUI.Loaded do Wait(100) end
    Storage.Prepare(function()
        Storage.GetLocalData()
        NUI.SendTranslations()
        while not Storage.Data do Wait(1000) end
    end)
end)
