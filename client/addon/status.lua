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

Citizen.CreateThread(function()
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

    AddEventHandler('esx_status:onTick', function(data)
        for i = 1, #data, 1 do
            if data[i].name == 'hunger' then
                tempVars['hunger'] = data[i].percent
            end
            if data[i].name == 'thirst' then
                tempVars['thirst'] = data[i].percent
            end
            if data[i].name == 'stress' then
                tempVars['stress'] = data[i].percent
            end
        end
    end)
end)
