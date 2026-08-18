Math = {}

function Math.GetScreenCoordFromWorldCoord(worldCoords)
    local onScreen, sx, sy = GetScreenCoordFromWorldCoord(worldCoords.x, worldCoords.y, worldCoords.z)
    if not onScreen then
        local camRot   = GetGameplayCamRot(2)
        local camDir   = RotationToDirection(camRot)
        local camCoord = GetGameplayCamCoord()

        local delta = vector3(
            worldCoords.x - camCoord.x,
            worldCoords.y - camCoord.y,
            worldCoords.z - camCoord.z)
        local norm = vector3(delta.x, delta.y, delta.z)
        norm:normalize()

        local dot     = norm.x * camDir.x + norm.y * camDir.y + norm.z * camDir.z
        local halfPi  = math.rad(90)

        if math.acos(dot) > halfPi then
            sx, sy = -1.0, -1.0
        else
            sx, sy = -2.0, -2.0
        end
    end
    return sx, sy
end

local function round(value, decimals)
    if not decimals then decimals = 1 end
    local factor = 10 ^ decimals
    return math.floor(value * factor + 0.5) / factor
end

local function percent(a, b)  return (a / b) * 100 end
local function percentH(a, b) return (a / b) * 100 end

function Math.Pixels_to_viewport(pixelCoords, viewW, viewH, decimals)
    if not decimals then decimals = 1 end
    local result = {}

    if pixelCoords.x then
        local pct = percent(pixelCoords.x, viewW)
        result.x  = string.format("%." .. decimals .. "fvw", round(pct, decimals)) or false
    else
        result.x = false
    end

    if pixelCoords.y then
        local pct = percentH(pixelCoords.y, viewH)
        result.y  = string.format("%." .. decimals .. "fvh", round(pct, decimals)) or false
    else
        result.y = false
    end

    return result
end

function RotationToDirection(rotation)
    local x, y, z = rotation.x, rotation.y, rotation.z
    local sinZ = -math.sin(math.rad(z))
    local cosX = math.abs(math.cos(math.rad(x)))
    local cosZ = math.cos(math.rad(z))
    local sinX = math.sin(math.rad(x))
    return vector3(sinZ * cosX, cosZ * math.abs(math.cos(math.rad(x))), sinX)
end

function calculateDistanceBetweenObjects(x1, y1)
    return math.sqrt((x1 - 0.5) ^ 2 + (y1 - 0.5) ^ 2)
end

function PreRequestModel(model, callback)
    if type(model) ~= "number" or not model then
        model = joaat(model)
    end
    if not HasModelLoaded(model) then
        if IsModelInCdimage(model) then
            RequestModel(model)
            while not HasModelLoaded(model) do Wait(0) end
        end
    end
    if callback ~= nil then callback() end
end

function SpawnVehicle(modelName, coords, heading, callback, networked)
    if networked == nil then networked = true end

    local modelHash = (type(modelName) ~= "number" or not modelName) and joaat(modelName) or modelName
    if type(coords) ~= "vector3" or not coords then
        coords = vec(coords.x, coords.y, coords.z)
    end

    local playerCoords = GetEntityCoords(PlayerPedId())
    if not coords or not playerCoords then return end

    CreateThread(function()
        PreRequestModel(modelHash)
        local veh = CreateVehicle(modelHash, coords.xyz, heading, networked, true)
        if networked then
            local netId = NetworkGetNetworkIdFromEntity(veh)
            SetNetworkIdCanMigrate(netId, true)
            SetEntityAsMissionEntity(veh, true, true)
        end
        SetVehicleHasBeenOwnedByPlayer(veh, true)
        SetVehicleNeedsToBeHotwired(veh, false)
        SetModelAsNoLongerNeeded(modelHash)
        SetVehRadioStation(veh, "OFF")
        RequestCollisionAtCoord(coords.xyz)
        while not HasCollisionLoadedAroundEntity(veh) do Wait(0) end
        if callback then callback(veh) end
        return veh
    end)
end

function cubicBezier(t, p0, p1, p2, p3)
    local u  = 1 - t
    local u2 = u * u
    local u3 = u2 * u
    local t2 = t * t
    local t3 = t2 * t
    return u3 * p0
         + 3 * u2 * t * p1
         + 3 * u  * t2 * p2
         + t3 * p3
end

function shortestAngularDistance(from, to)
    local diff = to - from
    return ((diff + 180) % 360) - 180
end

function smoothTransition(current, delta, factor)
    local target = current + delta
    local d      = shortestAngularDistance(current, target)
    return current + d * factor
end
