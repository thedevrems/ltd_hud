Threads.Vehicles = {}
Threads.Vehicles.Use              = false
Threads.Vehicles.StreetLabelUse   = false
Threads.Vehicles.BlacklistedHashModels = {}
Threads.Vehicles.IsRadarVisible   = false
Threads.Vehicles.RefreshInterval  = Config.UI.Preset.carhud.refreshInterval
Threads.Vehicles.DirectionList    = {}

Threads.Vehicles.Data = {
    vehicle      = 0,
    rpm          = 0,
    speed        = 0,
    gear         = 0,
    fuel         = 0,
    acceleration = 0,
}

CreateThread(function()
    for deg = 0, 360 do
        local label
        -- Points cardinaux en français : O pour ouest, et NO/SO plutôt que NW/SW.
        -- N, S, E, NE et SE s'écrivent pareil dans les deux langues.
        if     deg >= 0   and deg < 45  then label = "N"
        elseif deg >= 45  and deg < 90  then label = "NO"
        elseif deg >= 90  and deg < 135 then label = "O"
        elseif deg >= 135 and deg < 180 then label = "SO"
        elseif deg >= 180 and deg < 225 then label = "S"
        elseif deg >= 225 and deg < 270 then label = "SE"
        elseif deg >= 270 and deg < 315 then label = "E"
        else                                 label = "NE"
        end
        Threads.Vehicles.DirectionList[deg] = label
    end

    for modelName in pairs(Config.BlacklistedVehicles) do
        local hash = tostring(GetHashKey(modelName))
        Threads.Vehicles.BlacklistedHashModels[hash] = true
    end
end)

function Threads.Vehicles.Init()
    Threads.Vehicles.Use     = true
    Threads.Vehicles.IdleTime = 1000

    if Config.UseOxLibCache then
        debugPrint("[^6THREADS^7] [^2CARHUD^7] Using ox lib cache [/]")
    end

    local speedMultiplier = (Config.Metrics == "kmh") and 3.6 or 2.236936

    CreateThread(function()
        local idleInterval = Threads.Vehicles.IdleTime
        debugPrint("[^6THREADS^7] CARHUD interval set to ^2"
            .. math.floor(Threads.Vehicles.RefreshInterval.current) .. "ms^7")

        while Threads.Vehicles.Use do

            local inVehicle, vehicleHandle

            if Config.UseOxLibCache then
                vehicleHandle = cache and cache.vehicle
                inVehicle     = vehicleHandle and vehicleHandle ~= 0
            else
                local isPedInVeh = IsPedInAnyVehicle(Threads.Players.Data.ped)
                inVehicle        = (isPedInVeh == 1)
                if inVehicle then
                    vehicleHandle = GetVehiclePedIsIn(Threads.Players.Data.ped)
                end
            end

            if inVehicle and vehicleHandle and vehicleHandle ~= 0 then
                Threads.Vehicles.Data.vehicle   = vehicleHandle
                Threads.Vehicles.Data.doesExist = DoesEntityExist(vehicleHandle)
            elseif not inVehicle then
                Threads.Vehicles.Data.doesExist = false
            end

            if inVehicle then
                idleInterval = math.floor(Threads.Vehicles.RefreshInterval.current) or Threads.Vehicles.IdleTime
            else
                idleInterval = Threads.Vehicles.IdleTime
            end

            if inVehicle and Threads.Vehicles.Data.doesExist then
                local veh     = Threads.Vehicles.Data.vehicle
                local speed   = math.floor(GetEntitySpeed(veh) * speedMultiplier)
                local rpm     = math.floor(GetVehicleCurrentRpm(veh) * 100)
                local gear    = GetGear(veh)
                local fuel    = GetFuel(veh)
                local engine  = GetVehicleEngineHealth(veh) / 10

                local gearLabel = (gear == 0) and "R" or gear

                local changed = false
                local d       = Threads.Vehicles.Data

                if speed  ~= d.speed   then d.speed   = speed;  changed = true end
                if rpm    ~= d.rpm     then d.rpm     = rpm;    changed = true end
                if gearLabel ~= d.gear then d.gear    = gearLabel; changed = true end
                if fuel   ~= d.fuel    then d.fuel    = fuel;   changed = true end
                if engine ~= d.engine  then d.engine  = engine; changed = true end

                if changed then
                    SendNUIMessage({
                        type = "SET_CARHUD_VALUES",
                        data = {
                            speed  = speed,
                            rpm    = rpm,
                            gear   = gearLabel,
                            fuel   = fuel,
                            engine = engine,
                        }
                    })
                end
            end

            local currentScreen = Storage.CurrentScreen
            local interrupted   = (currentScreen ~= "game") and currentScreen or false
            local storedInVeh   = LocalPlayer.state.isInsideVehicle
            local storedInVehFlag = storedInVeh and storedInVeh.inVeh or false

            if interrupted and storedInVehFlag then
                local alreadyMarkedInterrupted = storedInVeh and storedInVeh.wasInterrupted
                if not alreadyMarkedInterrupted then
                    LocalPlayer.state:set("isInsideVehicle", { inVeh = false, wasInterrupted = true })
                    NUI.SendMessage("INDICATE_UNFASTEN_SEATBELT", { state = false })
                end
            elseif storedInVehFlag ~= inVehicle then

                if Config.UseOxLibCache then
                    Threads.Vehicles.Data.vehicle = cache.vehicle
                else
                    if inVehicle then
                        Threads.Vehicles.Data.vehicle = GetVehiclePedIsIn(Threads.Players.Data.ped) or 0
                    else
                        Threads.Vehicles.Data.vehicle = 0
                    end
                end

                if not inVehicle then
                    Threads.Vehicles.Data.doesExist = false
                end

                LocalPlayer.state:set("isInsideVehicle", {
                    inVeh         = inVehicle,
                    wasInterrupted = interrupted,
                })

                Library.EventCall("onVehicleStateChange",
                    Threads.Vehicles.Data.vehicle ~= 0,
                    Threads.Vehicles.Data.vehicle)
            end

            Citizen.Wait(idleInterval)
        end
    end)
end

function Threads.Vehicles.StreetLabel()
    if not Config.UI.UseStreetLabel then return end
    Threads.Vehicles.StreetLabelUse = true

    local distMultiplier = (Config.Metrics == "mph") and 0.62 or 1.0

    CreateThread(function()
        local hour   = GetClockHours()
        local minute = GetClockMinutes()
        local hourLocked = false

        while Threads.Vehicles.StreetLabelUse do
            minute = GetClockMinutes()
            if minute == 0 and not hourLocked then
                hour     = GetClockHours()
                hourLocked = true
            end
            if minute > 0 and hourLocked then hourLocked = false end

            local coords  = Threads.Players.Data.coords
            local heading = Threads.Players.Data.heading
            local data    = {
                direction = Threads.Vehicles.DirectionList[heading],
                streets   = GetStreetLabel(coords),
                time      = string.format("%02d:%02d", hour, minute),
                distance  = 0,
            }

            if IsWaypointActive() then
                local blip      = GetFirstBlipInfoId(8)
                local blipCoord = GetBlipCoords(blip)
                local dist      = CalculateTravelDistanceBetweenPoints(
                    coords.x, coords.y, coords.z,
                    blipCoord.x, blipCoord.y, blipCoord.z) / 1000

                data.distance = dist * distMultiplier
            end

            StreetLabel.SetStreetLabelData(data)
            Wait(550)
        end
    end)
end

AddStateBagChangeHandler("isInsideVehicle", nil, function(bag, key, value)
    local expectedBag = ("player:%s"):format(GetPlayerServerId(PlayerId()))
    if bag ~= expectedBag then return end

    if Threads.Vehicles.IsRadarVisible == value.inVeh then return end
    Threads.Vehicles.IsRadarVisible = value.inVeh

    local modelHash = tostring(GetEntityModel(Threads.Vehicles.Data.vehicle))
    if Threads.Vehicles.BlacklistedHashModels[modelHash] then
        value.inVeh = false
    end

    if Config.UI.UseStreetLabel and not Config.PersistentStreetLabel then
        if value.inVeh then
            if not Threads.Vehicles.StreetLabelUse then
                Threads.Vehicles.StreetLabel()
            end
        else
            Threads.Vehicles.StreetLabelUse = false
        end
        StreetLabel.SetVisible(value.inVeh)
    end

    if not Config.PersistentMinimap then
        DisplayRadar(value.inVeh, value.wasInterrupted)
    end

    NUI.SendMessage("SET_PERSPECTIVE_IN_VEH", { state = value.inVeh })
    NUI.SetComponentVisibility("carhud", value.inVeh)
end)

RegisterNUICallback("minimap.toggle", function(data)
    DisplayRadar(data.state, false)
    NUI.SendMessage("SET_PERSPECTIVE_IN_VEH", { state = data.state })
    StreetLabel.SetVisible(data.state)
end)
