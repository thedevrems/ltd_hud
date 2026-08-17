Threads = {}

Citizen.CreateThread(function()
    Wait(1000)
    debugPrint("[^6THREADS^7] Awaiting storage to load")

    Threads.Components.Init()
    Threads.Players.Init()
    Threads.GameplayCam.Init()

    while not Storage.Data.createdUI do Wait(0) end

    Threads.Point.Init()
    Threads.Chat.Init()
    Threads.Vehicles.Init()
    Threads.Weapon.Init()
    Threads.Hud.Init()
    Threads.DUI.Init()

    debugPrint("[^6THREADS^7] Loaded")
    Citizen.CreateThread(function()
        while not NUI.Loaded do Wait(0) end

        local ped       = PlayerPedId()
        local inVehicle = IsPedInAnyVehicle(ped) == 1

        if inVehicle then
            local vehicle = GetVehiclePedIsIn(ped)
            Threads.Vehicles.Data.vehicle   = vehicle
            Threads.Vehicles.Data.doesExist = DoesEntityExist(vehicle)
            Threads.Vehicles.IsRadarVisible = false
            LocalPlayer.state:set("isInsideVehicle", { inVeh = false, wasInterrupted = false })
            Wait(0)
            LocalPlayer.state:set("isInsideVehicle", { inVeh = true, wasInterrupted = false })
        end
    end)
end)
