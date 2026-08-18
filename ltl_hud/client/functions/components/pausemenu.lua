PauseMenu = {}
PauseMenu.Cam = false
PauseMenu.IsActive = false
PauseMenu.LastRecordedCamState = false
PauseMenu.SomePartIsStillOpening = false

function PauseMenu.Init()
    if not Config.UI.UsePauseMenu then return end
    if PauseMenu.Cam ~= false then return end
    if not LocalPlayer.state.UI_UserData then return end

    NUI.SendMessage("SHOW_PAUSEMENU", { state = true })
    SetNuiFocus(true, true)
    DisplayRadar(false, true)
end

CreateThread(function()
    LocalPlayer.state:set("UI_DataLoaded", false)
end)

function PauseMenu.Disable()
    NUI.SendMessage("SHOW_PAUSEMENU", { state = false })
    SetNuiFocus(false, false)
end

RegisterCommand("switchhud", function()
    NUI.SetUIVisible(false)
end)

AddStateBagChangeHandler("UI_UserData", nil, function(bag, key, value)
    local expectedBag = ("player:%s"):format(GetPlayerServerId(PlayerId()))
    if bag ~= expectedBag then return end

    if key == "UI_UserData" then
        if not NUI.Loaded then
            debugPrint("[^2UI_DATA^7] Awaiting for NUI to be loaded [/]")
            while not NUI.Loaded do Wait(0) end
            debugPrint("[^2UI_DATA^7] NUI loaded, continue")
        end
        debugPrint("[^2UI_DATA^7] Attempting to load player data [/]")
        debugPrint("[^2UI_DATA^7] Setting player data.")
        NUI.SendMessage("SET_PLAYER_DATA", value)
        debugPrint("[^2UI_DATA^7] Returning values back to the UI.")
        return PauseMenu.Update(value)
    end
end)

RegisterNetEvent("ltl_hud:Client:LoadPlayer")
AddEventHandler("ltl_hud:Client:LoadPlayer", function()
    Debug.Print("VISIBILITY", "^2ltl_hud:Client:LoadPlayer received^7 (NUI.Loaded=%s, UI_DataLoaded=%s)",
        Debug.Bool(NUI.Loaded), Debug.Bool(LocalPlayer.state.UI_DataLoaded))

    if not Config.HandleUIVisibilityOnBaseEvents then
        return Debug.Print("VISIBILITY", "^1Config.HandleUIVisibilityOnBaseEvents is false: the hud is never made visible here.^7")
    end

    local extraData = {}

    -- This event is the ONLY thing that turns the hud layers visible in a normal
    -- session, and it fires exactly once. If the NUI is not listening yet the
    -- message is lost and the guard below prevents any retry, so wait for it.
    if not NUI.Loaded then
        Debug.Print("VISIBILITY", "NUI not loaded yet, holding the visibility handshake [/]")
        while not NUI.Loaded do Wait(50) end
        Debug.Print("VISIBILITY", "NUI is loaded, resuming the visibility handshake.")
    end

    if not LocalPlayer.state.UI_DataLoaded then
        LocalPlayer.state:set("UI_DataLoaded", true)
        NUI.SetDataLoadedStatus(true)
        NUI.SetUIVisible(true)

        if GetResourceState("MugShotBase64") == "started" and Config.UI.UseMugShotBase64 then
            debugPrint("[^2UI_DATA_LOAD^7] [MUGSHOT] Mugshot available, creating instance [/]")
            local p = promise.new()
            CreateThread(function()
                local startTime  = GetGameTimer()
                local deadline   = startTime + 3000
                local mugshot    = exports.MugShotBase64:GetMugShotBase64(PlayerPedId())
                debugPrint("[^2UI_DATA_LOAD^7] [MUGSHOT] Awaiting for the instance to be created [/]")
                while GetGameTimer() < deadline and not mugshot do
                    mugshot = exports.MugShotBase64:GetMugShotBase64(PlayerPedId())
                    Wait(10)
                end
                debugPrint("[^2UI_DATA_LOAD^7] [MUGSHOT] Instance created, continue.")
                if mugshot then
                    debugPrint("[^2UI_DATA_LOAD^7] [MUGSHOT] Applied mugshot.")
                    extraData.mugshot = mugshot
                end
                debugPrint("[^2UI_DATA_LOAD^7] [MUGSHOT] Resolving promise.")
                p:resolve()
            end)
            Citizen.Await(p)
            debugPrint("[^2UI_DATA_LOAD^7] [MUGSHOT] Promise resolved.")
        end

        if Config.PersistentMinimap then
            debugPrint("[^2UI_DATA_LOAD^7] Preparing Minimap [/]")
            while not NUI.Loaded and not Minimap.Prepared and Storage.CurrentScreen ~= "game" do
                Wait(0)
            end
            debugPrint("[^2UI_DATA_LOAD^7] Minimap prepared.")
            DisplayRadar(true)

            if Config.PersistentStreetLabel then
                StreetLabel.SetVisible(true)
                if not Threads.Vehicles.StreetLabelUse then
                    Threads.Vehicles.StreetLabel()
                end
            end
        end
    end
end)

RegisterNetEvent("ltl_hud:Client:UnloadPlayer")
AddEventHandler("ltl_hud:Client:UnloadPlayer", function()
    debugPrint("[^2UI_DATA^7] Unloading player data.")
    if LocalPlayer.state.UI_DataLoaded then
        LocalPlayer.state:set("UI_DataLoaded", false)
        NUI.SetDataLoadedStatus(false)
        NUI.SetUIVisible(false)
    end
end)

RegisterNetEvent("ltl_hud:Client:PlayerInitialized")
AddEventHandler("ltl_hud:Client:PlayerInitialized", function()

end)

RegisterNetEvent("ltl_hud:Player:State:Set")
AddEventHandler("ltl_hud:Player:State:Set", function(data)
    PauseMenu.Update(data)
end)

function PauseMenu.Update(userData)
    NUI.SendMessage("UPDATE_PAUSEMENU", { userData = userData })
end

function PauseMenu.CreateCamInstance()
    local ped = Threads.Players.Data.ped
    local inVehicle = IsPedInAnyVehicle(ped) == 1
    local entity = ped

    if inVehicle then
        local vehicle   = GetVehiclePedIsIn(ped)
        local vehType   = GetVehicleType(vehicle)
        if vehType ~= "bike" then
            entity = vehicle
        else
            inVehicle = false
        end
    end

    if not PauseMenu.LastRecordedCamState then
        PauseMenu.LastRecordedCamState = GetFollowPedCamViewMode()
        if PauseMenu.LastRecordedCamState == 4 then
            SetFollowPedCamViewMode(1)
        end
    end

    local category    = inVehicle and "Vehicle" or "Player"
    local camOffsets  = CameraAngles[category].pause_menu.cam
    local focusOffsets = CameraAngles[category].pause_menu.focus
    local fov         = CameraAngles[category].pause_menu.fov

    local entityCoords  = GetEntityCoords(entity)
    local entityHeading = GetEntityHeading(entity)

    local focusWorld = GetOffsetFromCoordAndHeadingInWorldCoords(
        entityCoords.x, entityCoords.y, entityCoords.z,
        entityHeading,
        focusOffsets.x, focusOffsets.y, focusOffsets.z)

    local camWorld = GetOffsetFromCoordAndHeadingInWorldCoords(
        entityCoords.x, entityCoords.y, entityCoords.z,
        entityHeading,
        camOffsets.x, camOffsets.y, camOffsets.z)

    local camRot = Cameras.GetEulerRotationsFromCoords(camWorld, focusWorld)

    PauseMenu.Cam = CreateCamWithParams("DEFAULT_SCRIPTED_CAMERA", camWorld, camRot, fov, true, 2)
    RenderScriptCams(true, true)
    SetCamActive(PauseMenu.Cam, true)
    SetCamUseShallowDofMode(PauseMenu.Cam, true)
    SetCamNearDof(PauseMenu.Cam, 0.0)
    SetCamFarDof(PauseMenu.Cam, 12.3)
    SetCamDofStrength(PauseMenu.Cam, 20.8)

    while not DoesCamExist(PauseMenu.Cam) do Wait(0) end

    CreateThread(function()
        StartAudioScene("DEATH_SCENE")
        while PauseMenu.Cam ~= false do
            local coords  = GetEntityCoords(entity)
            local heading = GetEntityHeading(entity)

            local newFocus = GetOffsetFromCoordAndHeadingInWorldCoords(
                coords.x, coords.y, coords.z, heading,
                focusOffsets.x, focusOffsets.y, focusOffsets.z)
            local newCam = GetOffsetFromCoordAndHeadingInWorldCoords(
                coords.x, coords.y, coords.z, heading,
                camOffsets.x, camOffsets.y, camOffsets.z)
            local newRot = Cameras.GetEulerRotationsFromCoords(newCam, newFocus)

            SetCamCoord(PauseMenu.Cam, newCam)
            SetCamRot(PauseMenu.Cam, newRot, 2)
            SetUseHiDof()
            Wait(0)
        end
        StopAudioScene("DEATH_SCENE")
    end)
end

function PauseMenu.DestroyCam(force)
    if not PauseMenu.Cam then return end
    DestroyCam(PauseMenu.Cam)
    RenderScriptCams(false, false)
    PauseMenu.Cam = false
    SetFollowPedCamViewMode(PauseMenu.LastRecordedCamState)
    PauseMenu.LastRecordedCamState = false
end

RegisterNUICallback("pausemenu.handleCamera", function(data)
    PauseMenu.IsActive = data.state
    if data.state then
        PauseMenu.CreateCamInstance()
    else
        PauseMenu.DestroyCam(data.force)
    end
end)

RegisterNUICallback("pauseMenu.left", function()
    SetNuiFocus(false, false)
    local closeSerial = (PauseMenu.CloseSerial or 0) + 1
    PauseMenu.CloseSerial = closeSerial

    CreateThread(function()
        Wait(200)

        if PauseMenu.CloseSerial ~= closeSerial then return end
        if NUI.IsInterfaceDisabled then return end

        if Storage.CurrentScreen == "pausemenu" then return end

        local inVehicle = Threads.Vehicles.Data.vehicle ~= 0

        if Config.PersistentMinimap or inVehicle then
            DisplayRadar(true)
        end

        if inVehicle and Config.UI.UseStreetLabel then
            StreetLabel.SetVisible(true)
            if not Threads.Vehicles.StreetLabelUse then
                Threads.Vehicles.StreetLabel()
            end
        end
    end)
end)

RegisterNUICallback("pausemenu.disconnect", function()
    debugPrint("Disconnecting [/]")
    TriggerServerEvent("ltl_hud:Quit")
end)

RegisterNUICallback("pausemenu.handleNav", function(data)
    local path = data.path
    if PauseMenu.SomePartIsStillOpening then return end
    PauseMenu.Disable()

    if path.type == "game" then
        if path.value == "map" then
            CreateThread(function()
                PauseMenu.SomePartIsStillOpening = true
                NUI.SetUIVisible(false)
                ActivateFrontendMenu(GetHashKey("FE_MENU_VERSION_MP_PAUSE"), 0, -1)

                local isOpen = IsPauseMenuActive() and not IsPauseMenuRestarting()
                if not isOpen then
                    while not (IsPauseMenuActive() and not IsPauseMenuRestarting()) do
                        Wait(0)
                    end
                end

                GameMenu.CreateCameraAngle("map")
                CreateThread(function()
                    Wait(50)
                    PauseMenuceptionGoDeeper(0)
                    PauseMenuceptionTheKick()
                end)
                DisplayRadar(false, true)
                StartAudioScene("DEATH_SCENE")

                while true do
                    Citizen.Wait(0)
                    if IsControlJustPressed(0, 200) or IsControlJustPressed(0, 177) or IsControlJustPressed(0, 202) then
                        SetFrontendActive(0)
                        break
                    end
                end

                PauseMenu.SomePartIsStillOpening = false
                StopAudioScene("DEATH_SCENE")
                NUI.SetUIVisible(true)
                GameMenu.DestroyCamera()
                PauseMenu.Init()
            end)

        elseif path.value == "settings" then
            CreateThread(function()
                PauseMenu.SomePartIsStillOpening = true
                NUI.SetUIVisible(false)
                ActivateFrontendMenu(GetHashKey("FE_MENU_VERSION_LANDING_MENU"), 0, -1)

                local isOpen = IsPauseMenuActive() and not IsPauseMenuRestarting()
                if not isOpen then
                    while not (IsPauseMenuActive() and not IsPauseMenuRestarting()) do
                        Wait(0)
                    end
                end

                GameMenu.CreateCameraAngle("settings")
                DisplayRadar(false, true)
                StartAudioScene("DEATH_SCENE")
                LocalPlayer.state:set("UI_InSettings", true)

                while GetCurrentFrontendMenuVersion() == GetHashKey("FE_MENU_VERSION_LANDING_MENU") do
                    Citizen.Wait(0)
                end

                PauseMenu.SomePartIsStillOpening = false
                LocalPlayer.state:set("UI_InSettings", false)
                StopAudioScene("DEATH_SCENE")
                NUI.SetUIVisible(true)
                GameMenu.DestroyCamera()
                PauseMenu.Init()
            end)
        end

    elseif path.type == "custom_payload" then
        if path.export then
            local exportFn = exports[path.export.resource][path.export.exportFunction]
            local params   = (path.params and table.unpack(path.params)) or ""
            exportFn(params)

        elseif path.event then
            local eventType = path.event.type
            local eventName = path.event.name
            local params    = (path.params and table.unpack(path.params)) or ""

            if eventType == "client" then
                TriggerEvent(eventName, params)
            elseif eventType == "server" then
                TriggerServerEvent(eventName, params)
            end
        end
    end
end)

RegisterCommand("pause_menu", function()
    if Storage.CurrentScreen == "cinematic_mode" then return end
    if Workers.PauseMenu.PreventOpen() then
        return debugPrint("[^1PREVENT^7] Can not open up pause menu. Something else is open!")
    end
    PauseMenu.Init()
end)

RegisterKeyMapping("pause_menu", "Opens Pause Menu", "KEYBOARD", "ESCAPE")

if Config.UI.UsePauseMenu then
    CreateThread(function()
        local interval = Config.DisablePauseMenuInterval or 5
        while true do
            SetPauseMenuActive(false)
            Citizen.Wait(interval)
        end
    end)
else
    CreateThread(function()
        local lastState = false
        while true do
            local active = IsPauseMenuActive()
            if active ~= lastState then
                NUI.SetRoutePath(active and "/blank" or "/")
                lastState = active
            end
            Wait(1000)
        end
    end)
end

local playerTalkingLastState = false

if Config.UI.UseListenerForMumble and not Config.UI.DisableVoiceIndicator then
    CreateThread(function()
        while true do
            local isTalking = MumbleIsPlayerTalking(Threads.Players.Data.player) == 1
            if isTalking ~= playerTalkingLastState then
                if not Config.UI.Use3DVoiceIndicator then
                    if isTalking then TopContent.SetScreen("voice") end
                    TopContent.Init(isTalking)
                else
                    NUI.SendMessage("SET_VOICE_INDICATOR_PLAYER_TALKING", { state = isTalking })
                end
                playerTalkingLastState = isTalking
            end
            Wait(300)
        end
    end)
end
