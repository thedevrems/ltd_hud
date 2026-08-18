if not Config.UseSeatbelt then return debugPrint('[^2ADDON^7] Disabling initialization of seatbelt [/]') end
local initialized = false

CreateThread(function()
    Wait(1000)
    LocalPlayer.state:set('seatbeltActive', false)
end)

Seatbelt = {}
Seatbelt.CanSwap = true
Seatbelt.UnfastenTime = 0
Seatbelt.UnfastenThreadStarted = false
Seatbelt.UnfastenThreadBreak = false

Seatbelt.Thread = function()
    Seatbelt.CanSwap = false
    Wait(250)
    if Threads.Vehicles.Data['vehicle'] == 0 or not Threads.Vehicles.Data['vehicle'] then return end
    local class = GetVehicleClass(Threads.Vehicles.Data['vehicle'])
    if class == 8 or class == 13 then return end

    if not LocalPlayer.state['seatbeltActive'] then

        SetFlyThroughWindscreenParams(Config.Seatbelts.MinSpeed / (string.lower(Config.Metrics) == 'mph' and 2.236936 or 3.6), Config.Seatbelts.MinSpeed + 10 / (string.lower(Config.Metrics) == 'mph' and 2.236936 or 3.6), 17, Config.Seatbelts.MinimumDamage)
        Seatbelt.CanSwap = true

        Seatbelt.UnfastenTime = 0
        Seatbelt.UnfastenThreadStarted = false
        Seatbelt.UnfastenThreadBreak = false

        CreateThread(function()
            Seatbelt.UnfastenThreadStarted = true
            while not Seatbelt.UnfastenThreadBreak and Seatbelt.UnfastenThreadStarted and not LocalPlayer.state['seatbeltActive'] do
                Seatbelt.UnfastenTime = Seatbelt.UnfastenTime + 500
                if Seatbelt.UnfastenTime > 1000 then
                    NUI.SendMessage('INDICATE_UNFASTEN_SEATBELT', {
                        state = true
                    })
                    break
                end
                Wait(500)
            end
        end)
    else

        CreateThread(function()
            Seatbelt.CanSwap = true
            SetFlyThroughWindscreenParams(10000.0, 10000.0, 17.0, 500.0)
            while LocalPlayer.state['seatbeltActive'] and Threads.Vehicles.Data['vehicle'] ~= 0 do
                DisableControlAction(0, 75, true)
                Wait(3)
            end
        end)
    end
end

Seatbelt.SwitchState = function()
    if not Seatbelt.CanSwap then return end
    local lastState = not LocalPlayer.state['seatbeltActive']
    LocalPlayer.state:set('seatbeltActive', lastState)
    NUI.SendMessage('SET_CARHUD_SEATBELT', {
        state = lastState,
        sfx = true
    })
end

RegisterCommand(Config.Commands['seatbelt'], Seatbelt.SwitchState)
RegisterKeyMapping(Config.Commands['seatbelt'], Config.KeyBinds['seatbelt'].description, 'KEYBOARD', Config.KeyBinds['seatbelt'].key)

local hasSeatbeltOn = false
local cachedEntity = -1

Library.OnEventTick('onVehicleStateChange', function(isInVehicle, entity)
    if entity == cachedEntity then return end
    cachedEntity = entity
    Seatbelt.Thread()
    if isInVehicle then
        SetUserRadioControlEnabled(false)
        SetVehRadioStation(Threads.Vehicles.Data['vehicle'], 'OFF')
        local class = GetVehicleClass(entity)
        if class ~= 8 and class ~= 13 then

        end
    elseif not isInVehicle then
        LocalPlayer.state:set('seatbeltActive', false)

        NUI.SendMessage('SET_CARHUD_SEATBELT', {
            state = false
        })
        NUI.SendMessage('INDICATE_UNFASTEN_SEATBELT', {
            state = false
        })

        Seatbelt.UnfastenTime = 0
        Seatbelt.UnfastenThreadStarted = false
        Seatbelt.UnfastenThreadBreak = false
        Seatbelt.UnfastenIndicatorState = false
    end
end)

AddStateBagChangeHandler('seatbeltActive', nil, function(bag, key, value)
    if bag ~= ('player:%s'):format(GetPlayerServerId(PlayerId())) then return end
    hasSeatbeltOn = value
    Seatbelt.Thread()
    NUI.SendMessage('SET_CARHUD_SEATBELT', {
        state = hasSeatbeltOn,
        sfx = false
    })
    NUI.SendMessage('INDICATE_UNFASTEN_SEATBELT', {
        state = false,
    })

end)

exports('ToggleSeatbelt', function(state)
    NUI.SendMessage('SET_CARHUD_SEATBELT', {
        state = state
    })
end)
