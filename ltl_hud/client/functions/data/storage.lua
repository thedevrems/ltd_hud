Storage = {}
Storage.HasBeenSent  = false
Storage.CurrentScreen = ""
Storage.Data          = {}

-- Document JSON du compte tel qu'il sort de `ltl_hud_settings`, transmis
-- textuellement à la page. Reste nil tant que le serveur n'a pas répondu, et
-- après une réponse vide — c'est ce qui déclenche l'écran de bienvenue.
Storage.RemoteJSON = nil

-- Les deux graphies coexistent : la page envoie le nom du composant tel que son
-- store le nomme (`progressBar`, `helpNotify`) tandis que les anciennes clés de
-- stockage étaient en minuscules. `helpNotify` manquait, et toute modification
-- de la notification d'aide était rejetée par Storage.Updated sans rien changer
-- à l'écran — un réglage qui « ne tient pas » sans la moindre erreur.
Storage.UITypes = {
    hud         = true,
    carhud      = true,
    notifies    = true,
    helpnotify  = true,
    helpNotify  = true,
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
    TriggerServerEvent("ltl_hud:Settings:Reset")
    NUI.SendMessage("REMOVE_STORAGE_FULLY", {})
    debugPrint("[^3STORAGE^7] Removed saved storage data.")
end

-- =============================================
-- Persistance serveur
-- =============================================

-- Un créneau du document, envoyé au serveur qui le range dans
-- `ltl_hud_settings` sous l'identifiant du compte. Les écritures sont groupées
-- côté serveur, donc appeler ceci à chaque cran d'un curseur ne coûte rien.
function Storage.Persist(slot, value)
    if type(slot) ~= "string" or slot == "" then
        return Debug.Print("STORAGE", "^1Persist appelé sans créneau, ignoré.^7")
    end
    TriggerServerEvent("ltl_hud:Settings:Save", slot, value)
    Debug.Print("STORAGE", "Créneau ^3%s^7 envoyé au serveur.", slot)
end

-- Le HUD du joueur, lu en base avant que la page ne compose quoi que ce soit.
--
-- Réessayé plutôt que tenté une fois : quand le callback serveur n'existe pas
-- encore (ltl_hud relancé côté serveur pendant qu'un joueur se connecte), ox_lib
-- lève l'erreur dans son propre gestionnaire d'évènement et notre fonction de
-- rappel n'est jamais appelée — le silence est le seul symptôme. Et abandonner
-- sur ce silence signifierait renvoyer à l'écran de bienvenue un joueur qui a
-- déjà un HUD, puis écraser sa ligne avec ce qu'il refait.
Storage.FetchAttempts = 3
Storage.FetchTimeout  = 5000

function Storage.FetchRemote()
    for attempt = 1, Storage.FetchAttempts do
        local answered = false

        lib.callback("ltl_hud:Settings:Fetch", false, function(payload)
            Storage.RemoteJSON = (type(payload) == "string" and payload ~= "") and payload or nil
            answered = true
        end)

        local deadline = GetGameTimer() + Storage.FetchTimeout
        while not answered and GetGameTimer() < deadline do Wait(50) end

        if answered then
            return Debug.Print("STORAGE", "Réglages reçus : %s",
                Storage.RemoteJSON and ("^2%d octets^7"):format(#Storage.RemoteJSON)
                                    or "^3aucun HUD enregistré^7")
        end

        Debug.Print("STORAGE", "^3Aucune réponse du serveur (tentative %d/%d).^7", attempt, Storage.FetchAttempts)
    end

    -- Dit à voix haute : à partir d'ici le joueur voit les préréglages du
    -- serveur, et tout ce qu'il réglera écrasera ce que la base contenait.
    print("^1[ltl_hud] Le serveur n'a jamais répondu à ltl_hud:Settings:Fetch.^7")
    print("^1[ltl_hud] Les préréglages de Config.UI.Preset sont utilisés et l'écran de bienvenue va se rouvrir.^7")
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

    -- `stored` voyage encodé et non en table : une table Lua vide traverse le
    -- pont NUI tantôt en objet tantôt en tableau, et la page a besoin de savoir
    -- si un créneau existe ou pas.
    NUI.SendMessage("SEND_FULL_CFG", { config = Config, stored = Storage.RemoteJSON })
    NUI.SendAspectRatio()
end

RegisterCommand("dumpStorage", function()
    print(json.encode(Storage.Data))
end)

function Storage.Prepare(callback)
    debugPrint("[^2NUI^7] Sending data [/]")
    Config.IsMulticharacterStarted = _Lib.GetStartedResource(Config.MulticharacterResources) ~= nil
        or GetResourceState("ZSX_Multicharacter") == "started"

    -- Avant SEND_FULL_CFG, pas après : c'est ce message qui décide de chaque
    -- créneau de la page, donc les réglages en base doivent être là au moment où
    -- il part. Le compte est connu dès la connexion, bien avant le choix du
    -- personnage — le HUD est lié à la licence, pas au perso.
    Storage.FetchRemote()
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

RegisterNUICallback("storage.onUpdate", function(data, cb)
    debugPrint("[^5CB^7] Storage for component ^3[" .. data.component:upper() .. "]^7 has been updated. Retrieving values [/]")
    Storage.Updated(data.component, data.componentData)

    -- La page envoie le créneau de stockage à côté du nom de composant : les
    -- deux diffèrent (`progressBar` en mémoire, `progressbar` en base) et c'est
    -- le second qui nomme la clé du document.
    Storage.Persist(data.slot or (data.component and data.component:lower()), data.componentData)
    if cb then cb("ok") end
end)

RegisterNUICallback("storage.onMusicUpdate", function(data, cb)
    Storage.Persist("music", { url = data.url, volume = data.volume })
    if cb then cb("ok") end
end)

-- Le joueur vient de terminer l'écran de bienvenue. Ce drapeau est ce qui fait
-- qu'il ne le reverra plus, sur ce personnage comme sur les autres.
RegisterNUICallback("storage.setConfigured", function(_, cb)
    Storage.Data.UIConfigured = true
    Storage.Persist("configured", true)
    Debug.Print("PRESETS", "^2Interface marquée comme configurée^7 en base.")
    if cb then cb("ok") end
end)

RegisterNUICallback("storage.onPositionUpdate", function(data)
    TriggerEvent("ltl_hud:Storage:OnPositionUpdate", data.component, data.position, data.width, data.height)
end)

function Storage.GetHudColor(asRGB)
    -- Filet : la couleur arrive avec storage.onLoad, mais un point créé par une
    -- autre ressource avant que la page n'ait répondu tomberait sinon sur un
    -- index nil, et le sprite ne se créerait jamais.
    local color = (Storage.Data.color and Storage.Data.color.primaryColor) or Config.UI.DefaultColor

    if asRGB then
        local hex = color:gsub("#", "")
        return {
            r = tonumber("0x" .. hex:sub(1, 2)),
            g = tonumber("0x" .. hex:sub(3, 4)),
            b = tonumber("0x" .. hex:sub(5, 6)),
        }
    end
    return color
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

CreateThread(function()
    while not NUI.Loaded do Wait(100) end
    Storage.Prepare(function()
        Storage.GetLocalData()
        NUI.SendTranslations()
        while not Storage.Data do Wait(1000) end
    end)
end)
