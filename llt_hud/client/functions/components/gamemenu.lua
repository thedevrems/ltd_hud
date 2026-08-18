GameMenu = {}
GameMenu.Cam = false
GameMenu.IsActive = false
GameMenu.LastRecordedCamState = false

function GameMenu.CreateCameraAngle(menuName)
    if not menuName then menuName = "game_menu" end

    local ped = Threads.Players.Data.ped
    local inVehicle = IsPedInAnyVehicle(ped) == 1
    local entity = ped

    if inVehicle then
        local vehicle = GetVehiclePedIsIn(ped)
        local vehType = GetVehicleType(vehicle)
        if vehType == "bike" then
            entity = ped
        else
            entity = vehicle
        end
    end

    if not GameMenu.LastRecordedCamState then
        GameMenu.LastRecordedCamState = GetFollowPedCamViewMode()
        if GameMenu.LastRecordedCamState == 4 then
            SetFollowPedCamViewMode(1)
        end
    end

    local category    = inVehicle and "Vehicle" or "Player"
    local camOffsets  = CameraAngles[category][menuName].cam
    local focusOffsets = CameraAngles[category][menuName].focus
    local fov         = CameraAngles[category][menuName].fov

    local focusWorld = GetOffsetFromEntityInWorldCoords(entity, focusOffsets.x, focusOffsets.y, focusOffsets.z)
    local camWorld   = GetOffsetFromEntityInWorldCoords(entity, camOffsets.x, camOffsets.y, camOffsets.z)
    local rotation   = Cameras.GetEulerRotationsFromCoords(camWorld, focusWorld)

    GameMenu.Cam = CreateCamWithParams("DEFAULT_SCRIPTED_CAMERA", camWorld, rotation, fov, true, 2)
    RenderScriptCams(true, true)
    SetCamActive(GameMenu.Cam, true)
    SetCamUseShallowDofMode(GameMenu.Cam, true)
    SetCamNearDof(GameMenu.Cam, 0.0)
    SetCamFarDof(GameMenu.Cam, 12.3)
    SetCamDofStrength(GameMenu.Cam, 3.8)
    GameMenu.IsActive = true

    while not DoesCamExist(GameMenu.Cam) do
        Wait(0)
    end

    Citizen.CreateThread(function()
        StartAudioScene("DEATH_SCENE")
        while GameMenu.Cam ~= false do
            SetUseHiDof()
            local currentFocus  = GetOffsetFromEntityInWorldCoords(entity, focusOffsets.x, focusOffsets.y, focusOffsets.z)
            local currentCam    = GetOffsetFromEntityInWorldCoords(entity, camOffsets.x, camOffsets.y, camOffsets.z)
            local currentRot    = Cameras.GetEulerRotationsFromCoords(currentCam, currentFocus)
            SetCamCoord(GameMenu.Cam, currentCam)
            SetCamRot(GameMenu.Cam, currentRot, 2)
            Wait(0)
        end
        StopAudioScene("DEATH_SCENE")
    end)
end

function GameMenu.DestroyCamera()
    if not GameMenu.Cam then return end
    DestroyCam(GameMenu.Cam)
    RenderScriptCams(false, false)
    GameMenu.Cam = false
    GameMenu.IsActive = false
    SetFollowPedCamViewMode(GameMenu.LastRecordedCamState)
    GameMenu.LastRecordedCamState = false
end

RegisterNUICallback("gamemenu.handleCamera", function(data)
    if data.state then
        GameMenu.CreateCameraAngle()
    else
        GameMenu.DestroyCamera()
    end
end)

function GameMenu.Init()
    DisplayRadar(false, true)
    GameMenu.CreateCameraAngle()
    NUI.SendMessage("SHOW_SETTINGS", { state = true })
    NUI.SetFocus(true, true)
end

function GameMenu.ForceClose()
    GameMenu.DestroyCamera()
    NUI.SendMessage("SHOW_SETTINGS", { state = false })
    NUI.SetFocus(false, false)
end
