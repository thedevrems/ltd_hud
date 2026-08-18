Threads = {}

CreateThread(function()
    Wait(1000)
    debugPrint("[^6THREADS^7] Awaiting storage to load")

    Threads.Components.Init()
    Threads.Players.Init()
    Threads.GameplayCam.Init()

    -- Everything below is gated on the welcome flow being finished. A hud with no
    -- values (rather than no hud at all) usually means this gate never opened.
    Debug.Print("THREADS", "Waiting on Storage.Data.createdUI before starting the hud threads [/]")
    while not Storage.Data.createdUI do Wait(0) end
    Debug.Print("THREADS", "^2Gate opened^7, starting the interface threads.")

    Threads.Point.Init()
    Threads.Chat.Init()
    Threads.Vehicles.Init()
    Threads.Weapon.Init()
    Threads.Hud.Init()
    Threads.DUI.Init()

    Debug.Print("THREADS", "^2Loaded^7 (Hud.Use=%s, Config.Hud.Use=%s)",
        Debug.Bool(Threads.Hud.Use), Debug.Bool(Config.Hud.Use))
    CreateThread(function()
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
