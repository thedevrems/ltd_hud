Threads.Point = {}
Threads.Point.Use = false

function Threads.Point.Init()
    Threads.Point.Use = true

    Citizen.CreateThread(function()
        local idleInterval   = Config.Intervals.point.idle
        local lastPlayerCoords = Threads.Players.Data.coords

        while Threads.Point.Use do
            if Point.Amount > 0 then
                idleInterval = Config.Intervals.point.active

                local coordsChanged = Threads.Players.Data.coords ~= lastPlayerCoords
                if coordsChanged then
                    lastPlayerCoords = Threads.Players.Data.coords
                end

                for _, entry in pairs(Point.List) do

                    local worldCoords = nil
                    local hx, hy, hintOff = nil, nil, nil

                    local coordType = type(entry.coords) == "number"

                    if coordType then

                        if DoesEntityExist(entry.coords) then
                            worldCoords = GetEntityCoords(entry.coords)
                            hx, hy, hintOff = GetHintPosition(worldCoords)
                            entry.lastCoords = worldCoords
                        end
                    else

                        worldCoords = entry.coords
                        hx, hy, hintOff = GetHintPosition(worldCoords)
                    end

                    if not worldCoords and not coordType and entry.lastCoords then
                        hx, hy, hintOff = GetHintPosition(entry.lastCoords)
                    end

                    if worldCoords then
                        local playerDist  = #(Threads.Players.Data.coords - worldCoords)
                        local isClose     = playerDist < entry.requiredDistance

                        local drawDist   = (entry.options and entry.options.drawDistance) or nil
                        local distInt, distMetric

                        if not drawDist then
                            if playerDist > 1000 then
                                distInt    = math.floor(playerDist / 10) / 100
                                distMetric = "km"
                            else
                                distInt    = math.floor(playerDist)
                                distMetric = "m"
                            end

                            DrawSprite("ltl_ui_points_txd", entry.id,
                                hx, hy, 0.5, 0.5, 0.0, 255, 255, 255, 255)

                            if not entry.isInitialized then
                                SendDuiMessage(entry.duiObj, json.encode({ type = "INIT", state = true }))
                                entry.isInitialized = true
                            end

                            local wantHintOn = not hintOff
                            if entry.hintIsOn ~= wantHintOn then
                                entry.hintIsOn = wantHintOn
                                Point.SetAsHint(entry.duiObj, wantHintOn)
                            end

                            if entry.isClose ~= isClose then
                                entry.isClose = isClose
                                if isClose then
                                    if entry.options and entry.options.onNearby then
                                        entry.options.onNearby(entry.id)
                                    end
                                    if entry.options and entry.options.removeOnNearby then
                                        Point.Remove(entry.id)
                                    end
                                end
                                Point.SetAsClose(entry.duiObj, isClose)
                            end

                            if coordsChanged and entry.hintIsOn then
                                SendDuiMessage(entry.duiObj, json.encode({
                                    type     = "SET_DISTANCE",
                                    distance = { int = distInt, metric = distMetric },
                                }))
                            end
                        end
                    end
                end
            end

            Citizen.Wait(idleInterval)
        end
    end)
end
