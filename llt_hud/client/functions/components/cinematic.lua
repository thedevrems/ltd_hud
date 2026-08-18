Cinematic = {}
Cinematic.IsCameraModeOn     = false
Cinematic.CameraID           = -1
Cinematic.CurrentPresetIndex = 1
Cinematic.CameraMovementIsOn = false
Cinematic.FocusModeOn        = false

function Cinematic.Init()
    NUI.SendMessage("SET_CINEMATIC_MODE_STATE", { state = true })
end

local function resolveFocusCoords(entity, preset)
    local focusDef = preset.focus
    if focusDef.type == "playerPed" then
        local coords = GetEntityCoords(entity)
        if coords then return coords end
    end
    return vector3(focusDef.x, focusDef.y, focusDef.z)
end

function Cinematic.DestroyCamera()
    if Cinematic.CameraID == -1 then return end
    Cinematic.CurrentPresetIndex = 1
    DestroyCam(Cinematic.CameraID)
    SetCamActive(Cinematic.CameraID, false)
    RenderScriptCams(false, false)
    Cinematic.CameraID       = -1
    Cinematic.IsCameraModeOn = false
    Cinematic.FocusModeOn    = false
end

AddEventHandler("ltl_hud:Storage:OnScreenSwitched", function(prevScreen, currentScreen)
    if prevScreen == "cinematic_mode" and not Cinematic.FocusModeOn then
        Cinematic.DestroyCamera()
    end
end)

function Cinematic.ToggleCamera()
    Cinematic.IsCameraModeOn = not Cinematic.IsCameraModeOn

    if Cinematic.IsCameraModeOn then
        local ped       = Threads.Players.Data.ped
        local entity    = ped
        local inVehicle = IsPedInAnyVehicle(ped)
        if inVehicle then entity = Threads.Vehicles.Data.vehicle end

        local preset      = Config.CinematicPresets[1]
        local coords      = preset.coords
        local focusCoords = resolveFocusCoords(entity, preset)

        local camX = inVehicle and (coords.x + 2.0) or coords.x
        local camY = inVehicle and (coords.y + 2.0) or coords.y

        local focusWorld
        if preset.focus.type ~= "playerPed" then
            focusWorld = GetOffsetFromEntityInWorldCoords(entity, focusCoords.x, focusCoords.y, focusCoords.z)
        else
            focusWorld = focusCoords
        end

        local camPos = GetOffsetFromEntityInWorldCoords(entity, camX, camY, coords.z)
        local camRot = Cameras.GetEulerRotationsFromCoords(camPos, focusWorld)
        local fov    = preset.fov

        Cinematic.CameraID = CreateCamWithParams("DEFAULT_SCRIPTED_CAMERA", camPos, camRot, fov, true, 2)
        RenderScriptCams(true, true)
        SetCamActive(Cinematic.CameraID, true)
        SetCamUseShallowDofMode(Cinematic.CameraID, true)
        SetCamNearDof(Cinematic.CameraID, 0.0)
        SetCamFarDof(Cinematic.CameraID, 12.3)
        SetCamDofStrength(Cinematic.CameraID, 3.8)

        Citizen.CreateThread(function()
            while Cinematic.CameraID ~= -1 do
                Wait(0)
                SetUseHiDof()
            end
        end)
    else
        Cinematic.DestroyCamera()
    end
end

function Cinematic.SwitchPreset()
    if Cinematic.CameraID == -1 then return debugPrint("Camera is not active!") end
    if Cinematic.CameraMovementIsOn then return debugPrint("Camera is moving. Wait!") end

    Cinematic.CurrentPresetIndex = Cinematic.CurrentPresetIndex + 1
    if Cinematic.CurrentPresetIndex > 2 then
        Cinematic.CurrentPresetIndex = 1
    end

    local ped       = Threads.Players.Data.ped
    local entity    = ped
    local inVehicle = IsPedInAnyVehicle(ped)
    if inVehicle then entity = Threads.Vehicles.Data.vehicle end

    local idx    = Cinematic.CurrentPresetIndex
    local preset = Config.CinematicPresets[idx]
    local coords = preset.coords

    local focusCoords = resolveFocusCoords(entity, preset)
    local focusWorld
    if preset.focus.type ~= "playerPed" then
        focusWorld = GetOffsetFromEntityInWorldCoords(entity, focusCoords.x, focusCoords.y, focusCoords.z)
    else
        focusWorld = focusCoords
    end

    local camX   = inVehicle and (coords.x + 2.0) or coords.x
    local camY   = inVehicle and (coords.y + 2.0) or coords.y
    local camPos = GetOffsetFromEntityInWorldCoords(entity, camX, camY, coords.z)
    local camRot = Cameras.GetEulerRotationsFromCoords(camPos, focusWorld)
    local fov    = preset.fov

    Cinematic.CameraMovementIsOn = true
    Cameras.AsyncEaseIn(Cinematic.CameraID,
        { coords = camPos, rot = camRot, fov = fov },
        {
            coords = GetCamCoord(Cinematic.CameraID),
            rot    = GetCamRot(Cinematic.CameraID, 2),
            fov    = GetCamFov(Cinematic.CameraID),
        },
        650, 2, nil)
    Cinematic.CameraMovementIsOn = false
end

RegisterCommand(Config.Commands.cinematic_mode, function()
    if not Config.UI.UseCinematicModeOnKeybind then return end
    Cinematic.Init()
end)

RegisterCommand(Config.Commands.cinematic_focus, function()
    if Storage.CurrentScreen == "cinematic_mode" then
        Cinematic.FocusModeOn = true
        NUI.SetFocus(true, false)
        NUI.SendMessage("SET_CINEMATIC_FOCUS_MODE", { state = true })
    end
end)

RegisterNUICallback("cinematicMode.setFocusOff", function()

    Cinematic.FocusModeOn = false
    NUI.SetFocus(false, false)
    NUI.SendMessage("SET_CINEMATIC_FOCUS_MODE", { state = false })
end)

RegisterNUICallback("cinematicMode.toggleCamera", function()
    Cinematic.ToggleCamera()
end)

RegisterNUICallback("cinematicMode.switchPreset", function()
    Cinematic.SwitchPreset()
end)
