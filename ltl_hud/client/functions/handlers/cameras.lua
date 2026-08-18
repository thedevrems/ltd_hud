local glm = require("glm")

Cameras = {}
Cameras._prevQuat = nil

local function bezierPoints(easing)
    return
        (easing and easing[1]) or 0,
        (easing and easing[2]) or 0.5,
        (easing and easing[3]) or 1,
        (easing and easing[4]) or 1
end

local function buildDeltas(fromKf, toKf)
    local coordDelta = {
        x = toKf.coords.x - fromKf.coords.x,
        y = toKf.coords.y - fromKf.coords.y,
        z = math.floor((toKf.coords.z - fromKf.coords.z) * 1000) / 1000,
    }
    local rotDelta = {
        x = toKf.rot.x - fromKf.rot.x,
        y = toKf.rot.y - fromKf.rot.y,
        z = toKf.rot.z - fromKf.rot.z,
    }
    local fovDelta = toKf.fov - fromKf.fov
    return coordDelta, rotDelta, fovDelta
end

function Cameras.CamEaseIn(cam, toKf, fromKf, duration, rotOrder, easing, callback)
    local startTime   = GetGameTimer()
    local endTime     = startTime + duration
    local coordDelta, rotDelta, fovDelta = buildDeltas(fromKf, toKf)
    local angX = shortestAngularDistance(fromKf.rot.x, toKf.rot.x)
    local angY = shortestAngularDistance(fromKf.rot.y, toKf.rot.y)
    local angZ = shortestAngularDistance(fromKf.rot.z, toKf.rot.z)
    local cur  = { coord = fromKf.coords, rot = fromKf.rot, fov = fromKf.fov }

    CreateThread(function()
        while GetGameTimer() < endTime do
            local elapsed = GetGameTimer() - startTime
            local t       = elapsed / duration
            local p0, p1, p2, p3 = bezierPoints(easing)
            local factor  = cubicBezier(t, p0, p1, p2, p3)

            local newCoord = vector3(
                coordDelta.x * factor + cur.coord.x,
                coordDelta.y * factor + cur.coord.y,
                math.floor((coordDelta.z * factor + cur.coord.z) * 1000) / 1000)

            local newRot = vector3(
                smoothTransition(cur.rot.x, angX, factor),
                smoothTransition(cur.rot.y, angY, factor),
                smoothTransition(cur.rot.z, angZ, factor))

            local newFov = fovDelta * factor + cur.fov

            SetCamCoord(cam, newCoord)
            SetCamRot(cam, newRot, rotOrder)
            SetCamFov(cam, newFov)
            Wait(0)
        end
        if callback ~= nil then callback() end
    end)
end

function Cameras.CamEaseInFly(cam, toKf, fromKf, duration, rotOrder, easing, callback)
    local startTime   = GetGameTimer()
    local endTime     = startTime + duration
    local coordDelta, rotDelta, fovDelta = buildDeltas(fromKf, toKf)
    local angX = shortestAngularDistance(fromKf.rot.x, toKf.rot.x)
    local angY = shortestAngularDistance(fromKf.rot.y, toKf.rot.y)
    local angZ = shortestAngularDistance(fromKf.rot.z, toKf.rot.z)
    local cur  = { coord = fromKf.coords, rot = fromKf.rot, fov = fromKf.fov }

    CreateThread(function()
        while GetGameTimer() < endTime do
            local elapsed = GetGameTimer() - startTime
            local t       = elapsed / duration
            local p0, p1, p2, p3 = bezierPoints(easing)
            local factor  = cubicBezier(t, p0, p1, p2, p3)

            local newCoord = vector3(
                coordDelta.x * factor + cur.coord.x,
                coordDelta.y * factor + cur.coord.y,
                math.floor((coordDelta.z * factor + cur.coord.z) * 1000) / 1000)

            local newRot = vector3(
                smoothTransition(cur.rot.x, angX, factor),
                smoothTransition(cur.rot.y, angY, factor),
                smoothTransition(cur.rot.z, angZ, factor))

            local newFov = fovDelta * factor + cur.fov

            SetFlyCamCoordAndConstrain(cam, newCoord)
            SetCamRot(cam, newRot, rotOrder)
            SetCamFov(cam, newFov)
            Wait(0)
        end
        if callback ~= nil then callback() end
    end)
end

function Cameras.CamEaseCoord(cam, toCoord, fromCoord, duration, easing, callback)
    local startTime  = GetGameTimer()
    local endTime    = startTime + duration
    local coordDelta = {
        x = toCoord.x - fromCoord.x,
        y = toCoord.y - fromCoord.y,
        z = math.floor((toCoord.z - fromCoord.z) * 1000) / 1000,
    }
    local cur = { coord = fromCoord }

    CreateThread(function()
        while GetGameTimer() < endTime do
            local elapsed = GetGameTimer() - startTime
            local t       = elapsed / duration
            local p0, p1, p2, p3 = bezierPoints(easing)
            local factor  = cubicBezier(t, p0, p1, p2, p3)

            local newCoord = vector3(
                coordDelta.x * factor + cur.coord.x,
                coordDelta.y * factor + cur.coord.y,
                math.floor((coordDelta.z * factor + cur.coord.z) * 1000) / 1000)

            SetCamCoord(cam, newCoord)
            Wait(0)
        end
        if callback ~= nil then callback() end
    end)
end

function Cameras.CamEaseRot(cam, toRot, fromRot, duration, rotOrder, easing, callback)
    local startTime = GetGameTimer()
    local endTime   = startTime + duration
    local angX = shortestAngularDistance(fromRot.x, toRot.x)
    local angY = shortestAngularDistance(fromRot.y, toRot.y)
    local angZ = shortestAngularDistance(fromRot.z, toRot.z)
    local cur  = { rot = fromRot }

    CreateThread(function()
        while GetGameTimer() < endTime do
            local elapsed = GetGameTimer() - startTime
            local t       = elapsed / duration
            local p0, p1, p2, p3 = bezierPoints(easing)
            local factor  = cubicBezier(t, p0, p1, p2, p3)

            local newRot = vector3(
                smoothTransition(cur.rot.x, angX, factor),
                smoothTransition(cur.rot.y, angY, factor),
                smoothTransition(cur.rot.z, angZ, factor))

            SetCamRot(cam, newRot, rotOrder)
            Wait(0)
        end
        if callback ~= nil then callback() end
    end)
end

function Cameras.AsyncEaseIn(cam, toKf, fromKf, duration, rotOrder, easing, callback)
    local startTime   = GetGameTimer()
    local endTime     = startTime + duration
    local coordDelta, rotDelta, fovDelta = buildDeltas(fromKf, toKf)
    local angX = shortestAngularDistance(fromKf.rot.x, toKf.rot.x)
    local angY = shortestAngularDistance(fromKf.rot.y, toKf.rot.y)
    local angZ = shortestAngularDistance(fromKf.rot.z, toKf.rot.z)
    local cur  = { coord = fromKf.coords, rot = fromKf.rot, fov = fromKf.fov }

    local now = startTime
    while now < endTime do
        local elapsed = now - startTime
        local t       = elapsed / duration
        local p0, p1, p2, p3 = bezierPoints(easing)
        local factor  = cubicBezier(t, p0, p1, p2, p3)

        local newCoord = vector3(
            coordDelta.x * factor + cur.coord.x,
            coordDelta.y * factor + cur.coord.y,
            math.floor((coordDelta.z * factor + cur.coord.z) * 1000) / 1000)

        local newRot = vector3(
            smoothTransition(cur.rot.x, angX, factor),
            smoothTransition(cur.rot.y, angY, factor),
            smoothTransition(cur.rot.z, angZ, factor))

        local newFov = fovDelta * factor + cur.fov

        SetCamCoord(cam, newCoord)
        SetCamRot(cam, newRot, rotOrder)
        SetCamFov(cam, newFov)

        now = GetGameTimer()
        Wait(0)
    end
    if callback ~= nil then callback() end
end

function Cameras.HandleScreens(direction, entering, screenName, unused1, unused2)
    local ped = PlayerPedId()

    if direction == "left" then
        if entering then
            local targetCoord = GetOffsetFromEntityInWorldCoords(ped, -2.0, 5.0, 0.0)
            if screenName then NUI.HandleScreen(screenName, entering) end

            local fromKf = {
                coords = GetCamCoord(Entity.Vars.MainCamera),
                rot    = GetCamRot(Entity.Vars.MainCamera, 2),
                fov    = GetCamFov(Entity.Vars.MainCamera),
            }
            local toKf = {
                coords = targetCoord,
                rot    = GetCamRot(Entity.Vars.MainCamera, 2),
                fov    = GetCamFov(Entity.Vars.MainCamera),
            }
            Cameras.CamEaseIn(Entity.Vars.MainCamera, toKf, fromKf, 700, 2, nil, function()
                WorkerAfterSettingsInitiated()
            end)
        else
            if screenName then NUI.HandleScreen(screenName, entering) end

            local fromKf = {
                coords = GetCamCoord(Entity.Vars.MainCamera),
                rot    = GetCamRot(Entity.Vars.MainCamera, 2),
                fov    = GetCamFov(Entity.Vars.MainCamera),
            }
            local toKf = {
                coords = Entity.Vars.BaseData.coords,
                rot    = Entity.Vars.BaseData.rot,
                fov    = GetCamFov(Entity.Vars.MainCamera),
            }
            Cameras.CamEaseIn(Entity.Vars.MainCamera, toKf, fromKf, 700, 2, nil, function()
                WorkerAfterSettingsUnloaded()
            end)
        end

    elseif direction == "center" then
        if entering then
            if screenName then NUI.HandleScreen(screenName, entering) end
            local fromKf = {
                coords = GetCamCoord(Entity.Vars.MainCamera),
                rot    = GetCamRot(Entity.Vars.MainCamera, 2),
                fov    = GetCamFov(Entity.Vars.MainCamera),
            }
            local toKf = {
                coords = Entity.Vars.BaseData.centerData.coords,
                rot    = Entity.Vars.BaseData.centerData.rot,
                fov    = GetCamFov(Entity.Vars.MainCamera),
            }
            Cameras.CamEaseIn(Entity.Vars.MainCamera, toKf, fromKf, 700, 2, nil)
        else
            if screenName then NUI.HandleScreen(screenName, entering) end
            local fromKf = {
                coords = GetCamCoord(Entity.Vars.MainCamera),
                rot    = GetCamRot(Entity.Vars.MainCamera, 2),
                fov    = GetCamFov(Entity.Vars.MainCamera),
            }
            local toKf = {
                coords = Entity.Vars.BaseData.coords,
                rot    = Entity.Vars.BaseData.rot,
                fov    = GetCamFov(Entity.Vars.MainCamera),
            }
            Cameras.CamEaseIn(Entity.Vars.MainCamera, toKf, fromKf, 700, 2, nil)
        end
    end
end

function Cameras.HandleMotionBlur(enable)
    if enable then
        CreateThread(function()
            local startTime = GetGameTimer()
            local duration  = 2000
            local endTime   = startTime + duration
            local initStrength = 0.0
            local initFarDof   = 30.0
            local farDofRange  = initFarDof - 12.3

            local now = startTime
            while now < endTime do
                local t   = (now - startTime) / duration
                local str = initStrength + 3.8 * t
                local far = initFarDof - farDofRange * t
                SetCamFarDof(Entity.Vars.MainCamera, far)
                SetCamDofStrength(Entity.Vars.MainCamera, str)
                now = GetGameTimer()
                Citizen.Wait(0)
            end
        end)
    else
        CreateThread(function()
            local startTime    = GetGameTimer()
            local duration     = 2000
            local endTime      = startTime + duration
            local initStrength = GetCamDofStrength(Entity.Vars.MainCamera)

            local now = startTime
            while now < endTime do
                local t   = (now - startTime) / duration
                local str = initStrength - initStrength * t
                SetCamFarDof(Entity.Vars.MainCamera, 10.0)
                SetCamDofStrength(Entity.Vars.MainCamera, str)
                now = GetGameTimer()
                Citizen.Wait(0)
            end
        end)
    end
end

function Cameras.GetBasicQuaterion(fromAngle, toAngle)
    local diff = toAngle - fromAngle
    return quat(vec(0, 1, 0), diff)
end

local function quatDot(q1, q2)
    return q1.w * q2.w + q1.x * q2.x + q1.y * q2.y + q1.z * q2.z
end

local glmUp      = glm.vec3(0, 0, 1)
local glmForward = glm.vec3(0, 1, 0)

function Cameras.GetEulerRotationsFromCoords(fromCoord, toCoord, xOffset, yOffset, zOffset)
    xOffset = xOffset or 0.0
    if yOffset == nil then yOffset = false end
    zOffset = zOffset or 0.0

    local forward = glm.normalize(toCoord - fromCoord)
    local right   = glm.normalize(glm.cross(forward, glmUp))

    if glm.length(right) < 1e-4 then
        right = glm.vec3(1, 0, 0)
    end

    local up     = glm.cross(right, forward)
    local matrix = glm.mat3(right, forward, up)
    local q      = glm.quat_cast(matrix)

    if Cameras._prevQuat then
        if quatDot(Cameras._prevQuat, q) < 0 then
            q = -q
        end
    end
    Cameras._prevQuat = q

    local angles = glm.deg(glm.eulerAngles(q))

    local rx = ((angles.x + 180 + xOffset) % 360) - 180
    local ry = yOffset and ((angles.y + yOffset) % 360) or 0.0
    local rz = ((angles.z + 180 + zOffset) % 360) - 180

    return glm.vec3(rx, ry, rz)
end

RegisterCommand("testrotset", function(src, args)
    local x = tonumber(args[1]) + 0.0
    local y = tonumber(args[2]) + 0.0
    local z = tonumber(args[3]) + 0.0
    SetCamRot(Entity.Vars.MainCamera, x, y, z, 2)
end)

Cameras.Data = {}
