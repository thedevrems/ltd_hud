Map = {}
Map.UseThreads            = false
Map.Camera                = -1
Map.CurrentOffsets        = {}
Map.SwitchToCoords        = -1
Map.SwitchCoordsOriginalDiff = 0
Map.Offsets               = {}
Map.ZOffsetOriginalDiff   = -1
Map.ZOffset               = -1
Map.Blips                 = {}

function Map.Init()
    Wait(100)
    local ped    = Threads.Players.Data.ped
    local coords = GetEntityCoords(ped)
    local fov    = 40.0
    local rot    = vector3(-90.0, 0.0, 0.0)

    Map.Camera = CreateCamWithParams("DEFAULT_SCRIPTED_FLY_CAMERA", coords, rot, fov, false, 2)
    SetFlyCamCoordAndConstrain(Map.Camera, coords.x, coords.y, coords.z + 3000.0)
    SetCamActive(Map.Camera, true)
    SetFlyCamMaxHeight(Map.Camera, 15000.0)
    RenderScriptCams(true, true)

    Map.ZOffset = 6000.0
    Map.ZOffsetOriginalDiff = Map.ZOffset - coords.z + 3000.0
    Map.SwitchToCoords  = vector3(coords.x, coords.y, 0.0)
    Map.CurrentRotation = { x = rot.x, y = rot.y, z = rot.z }
    Map.CurrentOffsets  = { x = coords.x, y = coords.y, z = coords.z + 10000.0 }

    Cameras.CamEaseRot(Map.Camera, vector3(-90.0, 0.0, 0.0), rot, 2000, 2)
    SetNuiFocus(true, true)
    NUI.SendMessage("HANDLE_MAP_VIEW", { state = true })
    Map.Threads()
    Map.UseThreads = true
    SetTimecycleModifier("fogless")
    SetWeatherTypeNow("CLEAR")
    ClearWeatherTypePersist()
end

function Map.Destroy()
    if Map.Camera then

    end
end

local knownLocations = {
    vector3(2770.1, 4451.18, 48.05),
    vector3(-496.83, 5803.09, 36.59),
}

RegisterNUICallback("mapChangeCoordinates", function(data)
    local targetCoords = data.coords
    local camCoords    = GetCamCoord(Map.Camera)
    Map.SwitchToCoords = vector3(targetCoords.x, targetCoords.y, 0.0)

    local camFlat    = vector3(camCoords.x, camCoords.y, 0.0)
    local targetFlat = vector3(targetCoords.x, targetCoords.y, 0.0)
    Map.SwitchCoordsOriginalDiff = #(camFlat - targetFlat)
end)

RegisterNUICallback("mapOffsetView", function(data)
    Map.Offsets.x = 0.0 - (data.offset.x * 3)
    Map.Offsets.y = data.offset.y * 3

    local newX = Map.CurrentOffsets.x + Map.Offsets.x
    local newY = Map.CurrentOffsets.y + Map.Offsets.y
    Map.Offsets.x = 0.0
    Map.Offsets.y = 0.0
    Map.CurrentOffsets.x = newX
    Map.CurrentOffsets.y = newY

    Map.InterruptMovement(newX, newY)
    SetFlyCamCoordAndConstrain(Map.Camera, Map.CurrentOffsets.x, Map.CurrentOffsets.y, Map.CurrentOffsets.z)
end)

RegisterNUICallback("mapZOffsetView", function(data)
    Map.Offsets.z = Map.CurrentOffsets.z + data.offset
    Map.CurrentOffsets.z = Map.Offsets.z
end)

function Map.InterruptMovement(x, y)
    Map.SwitchToCoords         = vector3(x, y, 0.0)
    Map.SwitchCoordsOriginalDiff = -1
end

function Map.Threads()

    Citizen.CreateThread(function()
        while Map.UseThreads do
            SetWeatherTypePersist("CLEAR")
            SetWeatherTypeNowPersist("CLEAR")
            SetWeatherTypeNow("CLEAR")
            SetOverrideWeather("CLEAR")
            SetArtificialLightsState(true)
            DisableWorldhorizonRendering(true)
            SetCloudsAlpha(0.0)

            local camCoords = GetCamCoord(Map.Camera)
            local camFlat   = vector3(camCoords.x, camCoords.y, 0.0)
            local distToTarget = #(camFlat - Map.SwitchToCoords)
            local newCoords = false

            if distToTarget > 1.0 and Map.SwitchCoordsOriginalDiff > 0 then
                local t      = 0.25 * (1.0 - (distToTarget - 1.0) / Map.SwitchCoordsOriginalDiff)
                local nx     = camCoords.x + t * (Map.SwitchToCoords.x - camCoords.x)
                local ny     = camCoords.y + t * (Map.SwitchToCoords.y - camCoords.y)
                newCoords    = { x = nx, y = ny, z = camCoords.z }
                Map.CurrentOffsets.x = nx
                Map.CurrentOffsets.y = ny
            end

            local zDiff = Map.ZOffset - camCoords.z
            if zDiff > 1.0 then
                local t = 0.25 * (1.0 - (zDiff - 1.0) / Map.ZOffsetOriginalDiff)
                if not newCoords then
                    newCoords = { x = camCoords.x, y = camCoords.y }
                end
                newCoords.z = camCoords.z + t * (Map.ZOffset - camCoords.z)
                Map.CurrentOffsets.z = newCoords.z
            end

            if newCoords then
                SetFlyCamCoordAndConstrain(Map.Camera, newCoords.x, newCoords.y, newCoords.z)
            end
            Wait(0)
        end
    end)

    Citizen.CreateThread(function()
        while Map.UseThreads do
            for _, blip in pairs(Map.Blips) do
                local onScreen, sx, sy = GetScreenCoordFromWorldCoord(blip.coords.x, blip.coords.y, blip.coords.z)
                if onScreen then
                    DrawSprite("ltl_ui_blips_txd", blip.id, sx, sy, 0.5, 0.5, 0.0, 255, 255, 255, 255)
                end
            end
            Wait(0)
        end
    end)
end

function Map.CreateBlip(label, blipType, icon, coords)
    local id   = "blip_" .. _Lib.GenerateRandomString(10)
    Map.Blips[id] = {
        id       = id,
        label    = label,
        type     = blipType,
        icon     = icon,
        size     = 1.5,
        coords   = coords,
        position = { x = -100, y = -100 },
    }
    NUI.SendMessage("ADD_BLIP", Map.Blips[id])
end
