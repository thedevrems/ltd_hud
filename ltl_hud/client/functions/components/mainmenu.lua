MainMenu = {}
MainMenu.Data = { vehicle = -1, cam = -1 }

-- Le joueur a un corps dans le monde. ltl_core et ltl_multicharacter émettent
-- tous deux `ltl:onPlayerSpawn` une fois LTL.SpawnPlayer terminé, donc le même
-- drapeau couvre les deux entrées : le joueur qui charge un personnage existant
-- après avoir cliqué sur JOUER, et celui qui vient d'en créer un — dans ce
-- second cas le ped est construit avant l'apparition, jamais après.
MainMenu.PlayerSpawned = false

local initialCoords = false

AddEventHandler("ltl:onPlayerSpawn", function()
    if MainMenu.PlayerSpawned then return end
    MainMenu.PlayerSpawned = true
    Debug.Print("WELCOME", "^2ltl:onPlayerSpawn reçu^7 : le joueur est dans le monde.")
end)

-- Redémarrer ltl_hud en pleine partie ne rejoue pas `ltl:onPlayerSpawn` : il
-- n'est émis qu'une fois, au spawn. On relève donc l'état du framework au
-- démarrage de la ressource, et uniquement là — sur une connexion normale,
-- ltl_core passe PlayerLoaded à vrai dès que le ped existe, avant que
-- ltl_multicharacter n'ait fini de faire apparaître le joueur.
CreateThread(function()
    local deadline = GetGameTimer() + 5000
    while not DependenciesReady and GetGameTimer() < deadline do Wait(100) end

    if LTL and LTL.PlayerLoaded and not MainMenu.PlayerSpawned then
        MainMenu.PlayerSpawned = true
        Debug.Print("WELCOME", "^3Ressource redémarrée^7 en jeu : le joueur est déjà apparu.")
    end
end)

-- The intro scene is the entry point of the hud creation flow: its own text tells
-- the player to press ENTER to build their interface. Once one is on record for
-- their account there is nothing left for it to introduce, so a reconnect walks
-- past it instead of showing a screen whose only action is "continue".
--
-- With the configuration flow disabled there is nothing to create either way, so
-- the scene keeps its plain server-intro role and still runs every time.
function MainMenu.ShouldShowIntro()
    if not Config.UI.UseWelcomeScreen then return false end
    if not Config.UI.UseConfiguration then return true end
    if not Config.UI.WelcomeScreenOnFirstRunOnly then return true end
    return not Storage.Data.UIConfigured
end

-- The character selection is already placing the ped, running a camera and
-- fading the screen when this resource starts. Everything MainMenu.Init does
-- would fight it: the intro scene teleports the player to a random Config.Scenes
-- spot and calls RenderScriptCams, which drags the selection camera out of
-- wherever it was framed. So on this path the hud touches neither position nor
-- camera and simply waits for the character to be in the world.
function MainMenu.AwaitMulticharacter(resource)
    Debug.Print("WELCOME", "^3%s^7 is running: standing down, no intro scene and no camera.", resource)

    while not NUI.Loaded or not Storage.HasBeenSent do Wait(300) end
    NUI.SetRoutePath("/blank")

    -- ltl_hud:Client:LoadPlayer, raised once the slot is chosen, is what flips
    -- this. Unbounded on purpose: with no character there is nothing to draw,
    -- and the watchdog in handlers/debug.lua already reports a missing event.
    Debug.Print("WELCOME", "Waiting for the character to be loaded [/]")
    while not LocalPlayer.state.UI_DataLoaded do Wait(250) end
    Debug.Print("WELCOME", "^2Character loaded^7, waiting for the spawn [/]")

    -- Deux portes et non une. Le personnage chargé ne veut dire que « la fiche
    -- est arrivée » : le corps, lui, n'est posé dans le monde qu'à la fin de
    -- LTL.SpawnPlayer. Ouvrir l'écran de bienvenue entre les deux le collerait
    -- par-dessus un fondu au noir, et l'aperçu positionnerait les composants
    -- contre une caméra qui n'est pas encore celle du joueur.
    while not MainMenu.PlayerSpawned do Wait(250) end
    Debug.Print("WELCOME", "^2Joueur apparu^7, construction de l'interface.")

    LocalPlayer.state:set("UIV2_Preloaded", true)

    if Config.UI.UseConfiguration and not Storage.Data.UIConfigured then
        DisplayRadar(false, true, true)
        NUI.WelcomePreload()
    else
        NUI.SwitchScreen("GAME")
        Storage.SetUIAsCreated()
    end
end

function MainMenu.Handler()
    CreateThread(function()

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

        local multicharacter = _Lib.GetStartedResource(Config.MulticharacterResources)
        if multicharacter then
            return MainMenu.AwaitMulticharacter(multicharacter)
        end

        SetPlayerInvincible(PlayerId(), true)
        DoScreenFadeOut(1)
        Wait(1000)

        while not NUI.Loaded do Wait(0) end
        -- Storage.Data.UIConfigured only exists once the NUI has answered with the
        -- account document Lua fetched from the database, and the branch below
        -- reads it.
        while not Storage.HasBeenSent do Wait(0) end

        NUI.SendMessage("SET_PLAYER_STEAM_NAME", { name = GetPlayerName(PlayerId()) })

        if Config.BringPlayerAfterWelcomeScreenToInitialCoords then
            initialCoords = GetEntityCoords(PlayerPedId())
        end

        local showIntro = MainMenu.ShouldShowIntro()
        Debug.Print("WELCOME", "Intro scene: %s (UseWelcomeScreen=%s, UIConfigured=%s)",
            showIntro and "^2showing^7" or "^3skipped^7",
            Debug.Bool(Config.UI.UseWelcomeScreen), Debug.Bool(Storage.Data.UIConfigured))

        if showIntro then
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

    CreateThread(function()
        debugPrint("Awaiting Camera to be active")
        while not DoesCamExist(MainMenu.Data.cam) do Wait(0) end
        debugPrint("Camera active!")

        CreateThread(function()
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

    Debug.Print("WELCOME", "Main menu destroyed. UseConfiguration=%s, UIConfigured=%s",
        Debug.Bool(Config.UI.UseConfiguration), Debug.Bool(Storage.Data.UIConfigured))

    if Config.UI.UseConfiguration then
        if not Storage.Data.UIConfigured then
            Debug.Print("WELCOME", "Never configured -> opening the welcome/presets flow.")
            NUI.WelcomePreload()
        else
            Debug.Print("WELCOME", "Already configured -> straight to the game screen.")
            NUI.SwitchScreen("GAME")
            Storage.SetUIAsCreated()
        end
    else
        Debug.Print("WELCOME", "Configuration disabled -> straight to the game screen.")
        NUI.SwitchScreen("GAME")
        Storage.SetUIAsCreated()
    end

    MainMenu.Data.cam = -1
    Debug.Print("WELCOME", "Waiting for the NUI to confirm the UI was created [/]")
    while not Storage.Data.createdUI do Wait(0) end
    Debug.Print("WELCOME", "^2UI created^7, releasing the player.")

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
    CreateThread(function()
        while not NUI.Loaded or not Storage.HasBeenSent do Wait(100) end
        NUI.SetRoutePath("/blank")
        Wait(1000)
        NUI.SwitchScreen("GAME")
        Storage.SetUIAsCreated()
    end)
end

-- Undoes the SetEntityVisible(false) of an intro scene that was interrupted by a
-- resource restart. Skipped when a character selection is running: it hides the
-- ped on purpose while framing its own scene, and this would show it there.
CreateThread(function()
    if _Lib.GetStartedResource(Config.MulticharacterResources) then return end
    SetEntityVisible(PlayerPedId(), true)
end)

RegisterNUICallback("mainMenu.finished", function()
    MainMenu.Destroy()
end)
