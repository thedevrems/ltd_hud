Point = {}
Point.TXD    = CreateRuntimeTxd("ltl_ui_points_txd")
Point.Amount = 0
Point.List   = {}

function Point.Create(icon, coords, text, options)

    if type(coords) == "number" then
        if not DoesEntityExist(coords) then
            return debugPrint("[^1ERROR^7] Attempt to create a point for entity that does not exists!")
        end
    end

    local hintIsOn = nil
    if type(coords) == "number" and DoesEntityExist(coords) then
        coords = GetEntityCoords(coords)
        local _, hx, hy = GetHintPosition(coords)
        hintIsOn = hy
    else
        local _, hx, hy = GetHintPosition(coords)
        hintIsOn = hy
    end

    local id     = "point_" .. _Lib.GenerateRandomString(10)
    local width  = math.floor(2560.0)
    local height = math.floor(1440.0)

    local duiUrl = "https://cfx-nui-" .. GetCurrentResourceName() .. "/sprites/point.html"
    local duiObj = CreateDui(duiUrl, width, height)
    local duiHandle = GetDuiHandle(duiObj)

    while not IsDuiAvailable(duiObj) do Wait(100) end

    Point.List[id] = {
        id               = id,
        icon             = icon,
        coords           = coords,
        duiObj           = duiObj,
        duiHandle        = duiHandle,
        requiredDistance = 3.0,
        hintIsOn         = hintIsOn,
        options          = options,
        isInitialized    = false,
        isClose          = false,
        txn              = CreateRuntimeTextureFromDuiHandle(Point.TXD, id, duiHandle),
    }

    SendDuiMessage(duiObj, json.encode({ type = "SET_COLOR", color = Storage.GetHudColor() }))
    SendDuiMessage(duiObj, json.encode({ type = "SET_ICON",  icon  = icon }))
    SendDuiMessage(duiObj, json.encode({ type = "SET_TEXT",  text  = text or false }))

    Point.Amount = Point.Amount + 1
    return id
end

function Point.UpdateColor(color)
    for _, entry in pairs(Point.List) do
        SendDuiMessage(entry.duiObj, json.encode({ type = "SET_COLOR", color = color }))
    end
end

function Point.Remove(pointId)
    if not Point.List[pointId] then
        return debugPrint("[^1ERROR^7] Can not find point with ID:", pointId)
    end
    debugPrint("[^2POINT^7] Succesfully removed Point with ID:", pointId)
    SendDuiMessage(Point.List[pointId].duiObj, json.encode({ type = "REMOVE_ANIM" }))
    Wait(1250)
    DestroyDui(Point.List[pointId].duiObj)
    Point.List[pointId] = nil
    Point.Amount = Point.Amount - 1
end

function Point.SetAsHint(duiObj, state)
    SendDuiMessage(duiObj, json.encode({ type = "SET_VISIBILITY", state = state }))
end

function Point.SetDistance(duiObj, distInt, metric)
    SendDuiMessage(duiObj, json.encode({ type = "SET_DISTANCE", distance = { int = distInt, metric = metric } }))
end

function Point.SetAsClose(duiObj, state)
    SendDuiMessage(duiObj, json.encode({ type = "SET_AS_CLOSE", state = state }))
end
