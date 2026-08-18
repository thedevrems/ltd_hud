Library = {}
Library.RegisteredListeners = {}
Library.Cache = {}

Library.GetPed = function()
    return Threads.Players.Data['ped']
end

Library.GetPlayerID = function()
    return Threads.Players.Data['player']
end

Library.GetPlayerVehicle = function()
    return Threads.Vehicles.Data['vehicle']
end

Library.GetVehicleData = function()
    return {
        speed = Threads.Vehicles.Data['speed']
    }
end

Library.IsPedAiming = function()
    return Threads.Weapon.Data['isPedAiming']
end

Library.GetCurrentPedWeapon = function()
    return Threads.Weapon.Data['weapon']
end

Library.GetPedAmmo = function()
    return Threads.Weapon.Data['ammo']
end

Library.OnEventTick = function(eventType, callback)
    if not Library.RegisteredListeners[eventType] then
        Library.RegisteredListeners[eventType] = {}
    end
    table.insert(Library.RegisteredListeners[eventType], {
        callback = callback,
        invoker = GetCurrentResourceName()
    })
end

Library.EventCall = function(eventType, ...)
    local listeners = Library.RegisteredListeners[eventType]
    if not listeners then
        return
    end

    for _, cbData in ipairs(listeners) do
        if GetCurrentResourceName() == cbData.invoker then
            cbData.callback(...)
        end
    end
end
