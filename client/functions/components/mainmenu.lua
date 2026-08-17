MainMenu = {}
MainMenu.Data = { vehicle = -1, cam = -1 }

local initialCoords = false

function MainMenu.Handler()
    Citizen.CreateThread(function()

        if LocalPlayer.state.UIV2_Preloaded then
            while not NUI.Loaded or not Storage.HasBeenSent do
                Wait(300)
            end
            NUI.SetRoutePath("/blank")
            Wait(1000)
            Storage.SetUIAsCreated()
            NUI.SwitchScreen("GAME")
            return debugPrint("Player was already preloaded, skipping!")
        end

        SetPlayerInvincible(PlayerId(), true)
        DoScreenFadeOut(1)
        Wait(1000)

        while not NUI.Loaded do Wait(0) end

        NUI.SendMessage("SET_PLAYER_STEAM_NAME", { name = GetPlayerName(PlayerId()) })

        if Config.BringPlayerAfterWelcomeScreenToInitialCoords then
            initialCoords = GetEntityCoords(PlayerPedId())
        end

        if Config.UI.UseWelcomeScreen then
            MainMenu.Init()
        else
            Wait(2000)
            if Config.AwaitShutdownLoadingScreen then
                debugPrint("Awaiting loading screen [/]")
                while GetIsLoadingScreenActive() do Wait(1) end
                debugPrint("Loading screen disabled, continue.")
            else
                ShutdownLoadingScreen()
                ShutdownLoadingScreenNui()
                debugPrint("Shutting down loading screen [/]")
            end
            Wait(1000)

            LocalPlayer.state:set("UIV2_Preloaded", true)
            if Config.UI.UseConfiguration then
                if not Storage.Data.UIConfigured then
                    DisplayRadar(false, true, true)
                    NUI.WelcomePreload()
                else
                    NUI.SwitchScreen("GAME")
                    Storage.SetUIAsCreated()
                end
            else
                NUI.SwitchScreen("GAME")
                Storage.SetUIAsCreated()
            end

            debugPrint("Awaiting for UI to be created")
            while not Storage.Data.createdUI do Wait(100) end

            if Config.BringPlayerAfterWelcomeScreenToInitialCoords and initialCoords then
                SetEntityCoords(PlayerPedId(), initialCoords)
            end

            debugPrint("UI Created!")
            FreezeEntityPosition(PlayerPedId(), false)
            SetPlayerInvincible(PlayerId(), false)
            TriggerServerEvent("ltl_hud:Buckets:CreatePlayerBucket", false)

            if GetResourceState('ZSX_Multicharacter') == "started" then
                debugPrint("Found ZSX_Multicharacter! Initializing [/]")
                exports['ZSX_Multicharacter']:Initialize()
            else
                Workers.MainMenu.InitializeAfterConfigurationEnd()
            end
        end
    end)
end

RegisterCommand("fade1", function() DoScreenFadeIn(1) end)
RegisterCommand("fade2", function() DoScreenFadeOut(1) end)

function MainMenu.Init()
    local scenes = Config.Scenes
    local scene  = scenes[math.random(1, #scenes)]
    local dofAdjust = scene.dofAdjust

    TriggerServerEvent("ltl_hud:Buckets:CreatePlayerBucket", true)

    local spawnPos = vector3(scene.camCoords.x, scene.camCoords.y, scene.playerZIndex)
    SetEntityCoords(PlayerPedId(), spawnPos)
    SetEntityVisible(PlayerPedId(), false)
    FreezeEntityPosition(PlayerPedId(), true)
    DisplayRadar(false, true, true)

    debugPrint("Loading camera angles")
    local focusCoords = scene.focusCoords
    local camCoords   = scene.camCoords
    local rotation    = Cameras.GetEulerRotationsFromCoords(focusCoords, camCoords)
    local fov         = scene.fov

    MainMenu.Data.cam = CreateCamWithParams("DEFAULT_SCRIPTED_CAMERA", camCoords, rotation, fov, true, 2)

    if scene.shake ~= "none" then
        ShakeCam(MainMenu.Data.cam, scene.shake, scene.shakeAmplitude)
    end

    RenderScriptCams(true, true)
    SetCamActive(MainMenu.Data.cam, true)

    debugPrint("Setting DoF")
    SetCamUseShallowDofMode(MainMenu.Data.cam, true)
    SetCamNearDof(MainMenu.Data.cam, (dofAdjust and dofAdjust.near) or 0.0)
    SetCamFarDof(MainMenu.Data.cam,  (dofAdjust and dofAdjust.far)  or 12.3)
    SetCamDofStrength(MainMenu.Data.cam, (dofAdjust and dofAdjust.strength) or 20.8)

    Citizen.CreateThread(function()
        debugPrint("Awaiting Camera to be active")
        while not DoesCamExist(MainMenu.Data.cam) do Wait(0) end
        debugPrint("Camera active!")

        Citizen.CreateThread(function()
            if GetResourceState('ZSX_Loading') == "started" then
                SendLoadingScreenMessage(json.encode({ action = "DONE_ALL" }))
                Wait(1000)
                NUI.SetRoutePath("/mainmenu")
                DoScreenFadeIn(1)
                Wait(2000)
                ShutdownLoadingScreen()
                Wait(3500)
                ShutdownLoadingScreenNui()
                while GetIsLoadingScreenActive() do Wait(1) end
                SetNuiFocus(true, true)
            else
                if Config.AwaitShutdownLoadingScreen then
                    debugPrint("Awaiting loading screen [/]")
                    while GetIsLoadingScreenActive() do Wait(1) end
                    debugPrint("Loading screen disabled, continue.")
                else
                    ShutdownLoadingScreen()
                    ShutdownLoadingScreenNui()
                    debugPrint("Shutting down loading screen [/]")
                end
                SetNuiFocus(true, false)
                Wait(2000)
                NUI.SetRoutePath("/mainmenu")
                ShutdownLoadingScreenNui()
                DoScreenFadeIn(2000)
                Wait(1250)
                SetNuiFocus(true, true)
            end
        end)

        while MainMenu.Data.cam ~= -1 do
            SetUseHiDof()
            Wait(0)
        end
    end)
end

function MainMenu.Destroy()
    DoScreenFadeOut(2000)
    SetNuiFocus(false, false)
    while not IsScreenFadedOut() do Wait(100) end

    DestroyCam(MainMenu.Data.cam)
    SetCamActive(MainMenu.Data.cam, false)
    RenderScriptCams(false, false)
    LocalPlayer.state:set("UIV2_Preloaded", true)
    Wait(200)
    SetEntityVisible(PlayerPedId(), true)

    if GetResourceState('ZSX_Multicharacter') == "started" then

    end

    if Config.UI.UseConfiguration then
        if not Storage.Data.UIConfigured then
            NUI.WelcomePreload()
        else
            NUI.SwitchScreen("GAME")
            Storage.SetUIAsCreated()
        end
    else
        NUI.SwitchScreen("GAME")
        Storage.SetUIAsCreated()
    end

    MainMenu.Data.cam = -1
    debugPrint("Awaiting for UI to be created")
    while not Storage.Data.createdUI do Wait(0) end
    debugPrint("UI Created!")

    FreezeEntityPosition(PlayerPedId(), false)
    SetPlayerInvincible(PlayerId(), false)
    TriggerServerEvent("ltl_hud:Buckets:CreatePlayerBucket", false)

    if GetResourceState('ZSX_Multicharacter') == "started" then
        debugPrint("Found ZSX_Multicharacter! Initializing [/]")
        exports['ZSX_Multicharacter']:Initialize()
    else
        Workers.MainMenu.InitializeAfterConfigurationEnd()
    end
end

if Config.AutoStartMainMenu then
    MainMenu.Handler()
else
    Citizen.CreateThread(function()
        while not NUI.Loaded or not Storage.HasBeenSent do Wait(100) end
        NUI.SetRoutePath("/blank")
        Wait(1000)
        NUI.SwitchScreen("GAME")
        Storage.SetUIAsCreated()
    end)
end

Citizen.CreateThread(function()
    SetEntityVisible(PlayerPedId(), true)
end)

RegisterNUICallback("mainMenu.finished", function()
    MainMenu.Destroy()
end)
