Preview = {}
Preview.Cam          = false
Preview.Veh          = -1
Preview.PreCoords    = -1
Preview.PreHeading   = -1
Preview.NotifySerial = -1

function Preview.CreateCamera()
    local ped              = Threads.Players.Data.ped
    local vehicleCamConfig = CameraAngles.Preview.vehicle

    Preview.PreCoords  = GetEntityCoords(ped)
    Preview.PreHeading = GetEntityHeading(ped)

    SetEntityHeading(ped, vehicleCamConfig.heading)
    SetEntityCoords(ped, vehicleCamConfig.coords)

    SpawnVehicle(vehicleCamConfig.model, vehicleCamConfig.coords, vehicleCamConfig.heading, function(vehicle)
        Preview.Veh = vehicle
        TaskWarpPedIntoVehicle(ped, vehicle, -1)
    end)

    Wait(1000)
    NUI.SwitchScreen("PREVIEW")

    local camOffset   = CameraAngles.Preview.cam
    local focusOffset = CameraAngles.Preview.focus
    local focusWorld  = GetOffsetFromEntityInWorldCoords(ped, focusOffset.x, focusOffset.y, focusOffset.z)
    local camWorld    = GetOffsetFromEntityInWorldCoords(ped, camOffset.x, camOffset.y, camOffset.z)
    local camRot      = Cameras.GetEulerRotationsFromCoords(focusWorld, camWorld)
    local fov         = CameraAngles.Preview.fov

    Preview.Cam = CreateCamWithParams("DEFAULT_SCRIPTED_CAMERA", camWorld, camRot, fov, true, 2)
    RenderScriptCams(true, true)
    SetCamActive(Preview.Cam, true)
    SetCamUseShallowDofMode(Preview.Cam, true)
    SetCamNearDof(Preview.Cam, 0.0)
    SetCamFarDof(Preview.Cam, 12.3)
    SetCamDofStrength(Preview.Cam, 3.8)
    ShakeCam(Preview.Cam, "HAND_SHAKE", 0.3)

    Minimap.Prepare("Basic")
    Preview.IsActive = true

    CreateThread(function()
        DoScreenFadeIn(1)
        NUI.SendMessage("SET_STAGGER_VISIBILITY", { state = false })
        local preview = Translations.UI.screens.preview
        Preview.NotifySerial = Notify.Add(preview.header, preview.notify, "fas fa-envelope", -1)

        while Preview.Cam ~= false do Wait(1000) end

        Notify.Remove(Preview.NotifySerial)
        Preview.NotifySerial = -1
    end)

    CreateThread(function()
        while Preview.Cam ~= false do
            Wait(0)
            local currentFocus = GetOffsetFromEntityInWorldCoords(ped, focusOffset.x, focusOffset.y, focusOffset.z)
            local currentCam   = GetOffsetFromEntityInWorldCoords(ped, camOffset.x, camOffset.y, camOffset.z)
            local currentRot   = Cameras.GetEulerRotationsFromCoords(currentFocus, currentCam)
            SetCamCoord(Preview.Cam, currentCam)
            SetCamRot(Preview.Cam, currentRot, 2)
            SetUseHiDof()
        end
    end)
end

function Preview.AnimateCameraToEnd()
    if not Preview.Cam then
        return debugPrint("[^1ERROR^7] Attempted to animate preview camera, but it does not exists?")
    end

    local ped        = Threads.Players.Data.ped
    local focusWorld = GetOffsetFromEntityInWorldCoords(ped, 0.0, 0.3, 0.0)
    local camWorld   = GetOffsetFromEntityInWorldCoords(ped, -5.0, 5.0, 0.0)
    local camRot     = Cameras.GetEulerRotationsFromCoords(focusWorld, camWorld)

    TriggerServerEvent("ltl_hud:Buckets:CreatePlayerBucket", true)

    CreateThread(function()
        NUI.SendMessage("HANDLE_SFX_MESSAGE", { sfx = "hard_woosh" })
        Wait(250)
        NUI.SendMessage("HANDLE_BLACK_SCREEN", { state = true, duration = 2500 })
        NUI.SendMessage("SET_PREVIEW_VISIBILITY", { state = false })
        Wait(2800)
        NUI.SendMessage("SET_STAGGER_VISIBILITY", { state = true })
        NUI.SetRoutePath("/")
        DeleteEntity(Preview.Veh)
        RenderScriptCams(false, false)
        SetCamActive(Preview.Cam, false)
        DestroyCam(Preview.Cam)
        DisplayRadar(false, true)
        Preview.Cam = false
        NUI.SetFocus(false, false)
        Wait(1000)
        NUI.SendMessage("HANDLE_BLACK_SCREEN", { state = false, duration = 1 })
        Wait(100)
        NUI.SendMessage("SET_STAGGER_VISIBILITY", { state = false })
        SetEntityCoords(ped, Preview.PreCoords)
        SetEntityHeading(ped, Preview.PreHeading)
        Storage.SetUIAsCreated()
        NUI.SwitchScreen("GAME")
        TriggerServerEvent("ltl_hud:Buckets:CreatePlayerBucket", false)
    end)

    Cameras.CamEaseIn(Preview.Cam,
        { coords = camWorld, rot = camRot, fov = CameraAngles.Preview.fov },
        {
            coords = GetCamCoord(Preview.Cam),
            rot    = GetCamRot(Preview.Cam, 2),
            fov    = GetCamFov(Preview.Cam),
        },
        5000, 2)
end

RegisterNUICallback("preview.init", function()
    Preview.CreateCamera()
end)

RegisterNUICallback("preview.end", function()
    Preview.AnimateCameraToEnd()
end)

RegisterNUICallback("preview.goBackToCustomize", function()
    NUI.SetFocus(false, false)
    NUI.SendMessage("SET_STAGGER_VISIBILITY", { state = true })
    Wait(650)
    DeleteEntity(Preview.Veh)
    DisplayRadar(false, true)
    RenderScriptCams(false, false)
    SetCamActive(Preview.Cam, false)
    DestroyCam(Preview.Cam)
    Preview.Cam = false
    NUI.SetRoutePath("/welcome/customize")
    Wait(500)
    NUI.SetFocus(true, true)
    NUI.SendMessage("SET_STAGGER_VISIBILITY", { state = false })
end)
