Threads.Interaction = {}
Threads.Interaction.Use          = false
Threads.Interaction.CurrentlyUsed = false
Threads.Interaction.Chunked      = {}

function Threads.Interaction.Init()
    Threads.Interaction.Use = true
    Threads.Interaction.Chunks()
    Threads.Interaction.Visibility()
    Threads.Interaction.Keys()
end

function Threads.Interaction.Keys()
    CreateThread(function()
        while Threads.Interaction.Use do
            local used = Threads.Interaction.CurrentlyUsed
            if used then

                local dir = false
                if IsControlJustPressed(0, 85) then dir = "Q"
                elseif IsControlJustPressed(0, 86) then dir = "E"
                end

                if dir ~= false then
                    Interaction.ChangeSelectedElement(
                        used.duiObj,
                        dir == "E",
                        used.id)
                    Threads.Interaction.CurrentlyUsed.key = nil
                else

                    if Interaction.ProgressVar > 0 or IsDisabledControlPressed(0, 73) then
                        local onCooldown = LocalPlayer.state.IsInteractionCooldownActive
                        local holding    = (not onCooldown) and IsDisabledControlPressed(0, 73)
                        local status     = holding and holding or "ON_COOLDOWN"

                        local completed = Interaction.UpdateProgress(used.duiObj, status)
                        if completed and used.elementData and used.elementData.object
                                     and used.elementData.object.onAction then
                            used.elementData.object.onAction()
                        end
                    end
                end
                Wait(0)
            else
                Wait(1000)
            end
        end
    end)
end

function Threads.Interaction.Chunks()
    CreateThread(function()
        while Threads.Interaction.Use do
            for _, entry in pairs(Interaction.List) do
                local dist = #(entry.coords - Threads.Players.Data.coords)
                if dist < 30.0 then
                    Threads.Interaction.Chunked[entry.id] = entry
                else
                    if Threads.Interaction.Chunked[entry.id] then
                        Threads.Interaction.Chunked[entry.id] = nil
                    end
                end
            end
            Wait(1000)
        end
    end)
end

function Threads.Interaction.Visibility()
    CreateThread(function()
        while Threads.Interaction.Use do
            local closest = { element = false, distance = 999999.0 }

            for _, entry in pairs(Threads.Interaction.Chunked) do
                local onScreen, sx, sy = GetScreenCoordFromWorldCoord(
                    entry.coords.x, entry.coords.y, entry.coords.z)

                if onScreen then
                    DrawSprite("ltl_ui_interaction_txd", entry.id,
                        sx, sy, 0.5, 0.5, 0.0, 255, 255, 255, 255)

                    local screenDist = calculateDistanceBetweenObjects(sx, sy)
                    if screenDist < closest.distance then
                        local worldDist = #(entry.coords - Threads.Players.Data.coords)
                        if worldDist < entry.radius then
                            closest.element  = entry
                            closest.distance = screenDist
                        end
                    end
                end
            end

            local current = Threads.Interaction.CurrentlyUsed

            if closest.element then
                if current then
                    if current.id ~= closest.element.id then

                        Interaction.SetAsClose(closest.element.duiObj, true)
                        Interaction.SetAsClose(current.duiObj, false)
                        Threads.Interaction.CurrentlyUsed = closest.element
                    end
                else
                    Threads.Interaction.CurrentlyUsed = closest.element
                    Interaction.SetAsClose(closest.element.duiObj, true)
                end
            else
                if current then
                    Interaction.SetAsClose(current.duiObj, false)
                end
                Threads.Interaction.CurrentlyUsed = false
            end

            Wait(0)
        end
    end)
end
