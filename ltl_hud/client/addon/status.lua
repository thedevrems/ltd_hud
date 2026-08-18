-- ltl_core n'embarque aucun système de statuts : il délègue à une ressource externe.
-- Celle-ci passe de esx_status à ltl_status, et les deux publient le même payload sur
-- `<ressource>:onTick`. On s'abonne aux deux noms plutôt qu'à un seul : la ressource
-- absente n'émet jamais son évènement, donc le HUD fonctionne avant, pendant et après
-- la bascule sans qu'aucune ligne ne soit à toucher ici.
local StatusProviders <const> = { 'ltl_status', 'esx_status' }

-- Seuls ces trois statuts alimentent une jauge. Filtrer par nom évite qu'un statut
-- personnalisé ajouté côté ressource (`voice`, par exemple) n'écrase une valeur qui a
-- une autre source.
local TrackedStatus <const> = { hunger = true, thirst = true, stress = true }

local tempVars = {}
tempVars['hunger'] = 0
tempVars['thirst'] = 0
tempVars['stress'] = 0
tempVars['voice'] = 50

local cachedMaxHealth = 200
local lastMaxHealthCheck = 0

AddStateBagChangeHandler('proximity', nil, function(bag, key, val)
    if bag ~= ('player:%s'):format(GetPlayerServerId(PlayerId())) then return end
    if type(val) ~= 'table' or not val.mode then return end
    tempVars['voice'] = Config.Voice.NameToProgress[val.mode] or Config.Voice.DefaultProgress
end)

CreateThread(function()
    while not NUI.Loaded or not Storage.HasBeenSent do
        Wait(1000)
    end
    Wait(1000)

    Config.Hud.Status['health'].get = function()
        local currentTime = GetGameTimer()
        if currentTime - lastMaxHealthCheck > 5000 then
            cachedMaxHealth = GetEntityMaxHealth(Threads.Players.Data['ped'])
            lastMaxHealthCheck = currentTime
        end

        return (GetEntityHealth(Threads.Players.Data['ped']) - 100) / (cachedMaxHealth - 100) * 100
    end

    Config.Hud.Status['armour'].get = function()
        return GetPedArmour(Threads.Players.Data['ped'])
    end

    Config.Hud.Status['hunger'].get = function()
        return tempVars['hunger']
    end

    Config.Hud.Status['thirst'].get = function()
        return tempVars['thirst']
    end

    if Config.Hud.Status['stress'] then
        Config.Hud.Status['stress'].get = function()
            return tempVars['stress']
        end
    end

    local function onStatusTick(data)
        for i = 1, #data, 1 do
            local status = data[i]
            if TrackedStatus[status.name] then
                tempVars[status.name] = status.percent
            end
        end
    end

    for i = 1, #StatusProviders do
        AddEventHandler(('%s:onTick'):format(StatusProviders[i]), onStatusTick)
    end
end)
