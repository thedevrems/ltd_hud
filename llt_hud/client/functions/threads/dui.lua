Threads.DUI = {}
Threads.DUI.Use   = false
Threads.DUI.Cache = {}
Threads.DUI.Sleep = true

function Threads.DUI.Init()
    Threads.DUI.Use = true

    Citizen.CreateThread(function()
        while Threads.DUI.Use do

            Threads.DUI.Sleep = (DUIS.Players.Amount == 0)
            local interval    = Threads.DUI.Sleep and 1000 or 0

            if not Threads.DUI.Sleep then
                local playerCoords = GetEntityCoords(Threads.Players.Data.ped)

                for key, entry in pairs(DUIS.Players.List) do

                    if LocalPlayer.state.LowFPSDetected then
                        DUIS.Players.Remove(key)
                        debugPrint("[^9DUI_HANDLER^7] Removing DUI for: DUI_" .. key .. " | LOW_FPS_DETECT")
                    else

                        if entry.endMessageTimer then
                            if GetGameTimer() > entry.endMessageTimer then
                                DUIS.Players.Remove(key)
                                debugPrint("[^9DUI_HANDLER^7] Removing DUI for: DUI_" .. key)
                            end
                        else

                            local headOffset   = GetOffsetFromEntityInWorldCoords(entry.playerPedId, 0, 0, 0.4)
                            local onScreen, sx, sy = GetScreenCoordFromWorldCoord(headOffset.x, headOffset.y, headOffset.z)

                            if onScreen and Config.UI.DUI3D_CheckForIntersectWorld then
                                onScreen = HasEntityClearLosToEntity(Threads.Players.Data.ped, entry.playerPedId, 1)
                            end

                            if onScreen then
                                local dist  = #(headOffset - playerCoords)
                                local scale = (dist <= 10) and (dist / 15) or 0.66

                                DrawSprite(
                                    "ltl_ui_players_txd", entry.id,
                                    sx, sy,
                                    0.5 - 0.5 * scale,
                                    0.5 - 0.5 * scale,
                                    0.0, 255, 255, 255, 255)
                            end
                        end
                    end
                end
            end

            Wait(interval)
        end
    end)
end
