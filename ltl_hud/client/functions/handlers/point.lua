function GetHintPosition(coords)
    local onScreen, screenX, screenY = GetScreenCoordFromWorldCoord(coords.x, coords.y, coords.z)

    if onScreen then
        if screenX > 0.95 or screenX < 0.05 or screenY > 0.95 or screenY < 0.05 then
            onScreen = false
        end
    end

    if onScreen then
        return screenX, screenY, false
    end

    local camFwd, camRight, camUp, camPos = GetCamMatrix(Threads.GameplayCam.Id)

    local delta = {
        x = coords.x - camPos.x,
        y = coords.y - camPos.y,
        z = coords.z - camPos.z,
    }

    local len = math.sqrt(delta.x * delta.x + delta.y * delta.y + delta.z * delta.z)
    delta.x = delta.x / len
    delta.y = delta.y / len
    delta.z = delta.z / len

    local dotRight = delta.x * camFwd.x + delta.y * camFwd.y + delta.z * camFwd.z
    local dotUp    = delta.x * camRight.x + delta.y * camRight.y + delta.z * camRight.z

    local edgeX, edgeY = 0.5, 0.5

    if math.abs(dotRight) > math.abs(dotUp) then

        if dotRight > 0 then
            edgeX = 0.95
            edgeY = 0.5 - (0.5 * dotUp / dotRight)
        else
            edgeX = 0.05
            edgeY = 0.5 + (0.5 * dotUp / dotRight)
        end
    else

        if dotUp > 0 then
            edgeY = 0.05
            edgeX = 0.5 + (0.5 * dotRight / dotUp)
        else
            edgeY = 0.95
            edgeX = 0.5 - (0.5 * dotRight / dotUp)
        end
    end

    edgeX = math.max(0.05, math.min(0.95, edgeX))
    edgeY = math.max(0.05, math.min(0.95, edgeY))

    return edgeX, edgeY, true
end
