local DisplayRadarState = {
    state    = false,
    forced   = false,
    isForced = false,
}

_G.DisplayRadar = function(state, forced, isForced)
    DisplayRadarState.state    = state
    DisplayRadarState.forced   = forced
    DisplayRadarState.isForced = isForced
    Minimap.Visible            = state

    if isForced then

        _DisplayRadar(state)
    else
        CreateThread(function()

            if not (Minimap.Prepared and NUI.Loaded) then
                while not (Minimap.Prepared and NUI.Loaded) do Wait(0) end
            end

            Minimap.Animate(state, forced)

            if not forced then Wait(400) end

            local currentScreen = Storage.GetCurrentScreen()

            local shouldAbort
            if state then

                local stateFlipped = (DisplayRadarState.state == false)
                shouldAbort = stateFlipped
            else

                local stateFlipped = (DisplayRadarState.state == true)
                shouldAbort = stateFlipped
            end

            if shouldAbort then
                state = false
                debugPrint("[^2MINIMAP^7] Early exit. State has changed.")
            end

            _DisplayRadar(state)
        end)
    end

    Workers.Minimap.OnVisibilityStateChange(state)
end
