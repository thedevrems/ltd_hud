Threads.Players = {}
Threads.Players.Use  = false

Threads.Players.Data = {
    ped     = 0,
    player  = -1,
    coords  = vector3(0, 0, 0),
    heading = 0,
}

function Threads.Players.Init()
    Threads.Players.Use          = true
    Threads.Players.Data.player  = PlayerId()

    CreateThread(function()
        while Threads.Players.Use do
            local ped, player

            if Config.UseOxLibCache then
                ped    = cache.ped
                player = cache.playerId
            else
                ped    = PlayerPedId()
                player = PlayerId()
            end

            local coords  = GetEntityCoords(ped)
            local heading = math.floor(GetEntityHeading(ped))

            Threads.Players.Data.ped     = ped
            Threads.Players.Data.coords  = coords
            Threads.Players.Data.heading = heading
            Threads.Players.Data.player  = player

            Wait(200)
        end
    end)
end
