Players = {}
Players.GlobalData = {}
Players.ActiveSources = {}

Players.SetData = function(src)
    local xPlayer = ESX and ESX.GetPlayerFromId(src)
    if not xPlayer then return end

    local data = {}
    data.firstname = xPlayer.variables.firstName
    data.lastname = xPlayer.variables.lastName
    data.base = GetBaseRows(src)
    data.id = src
    data.wallets = GetUserWallets(src)
    data.addon = {}
    Players.GlobalData[tostring(src)] = data
    TriggerClientEvent('ltl_hud:Client:PlayerInitialized', src)
    debugPrint('[^2PLAYER^7] Succesfully set player data for ['..src..'] ('..GetPlayerName(src)..')')
    Player(src).state:set('UI_UserData', data, true)
end

Citizen.CreateThread(function()
    Wait(5000)
    local isSeatbeltSet = GetConvar('game_enableFlyThroughWindscreen', true) == 'true'
    print('\n\n')
    debugPrint('[^2SEATBELT^7] '..(isSeatbeltSet and 'Seatbelt convar is ^2properly set^7.' or 'Seatbelt convar is ^1missing^7. Make sure to add in server.cfg: \n ^setr game_enableFlyThroughWindscreen true^7'))
    print('\n\n')
end)

Players.Listener = function(src, variable, newData)
    if Players.GlobalData[tostring(src)][variable] then
        Players.GlobalData[tostring(src)][variable] = newData
        Player(src).state:set('UI_UserData', data, true)
        debugPrint('[^2PLAYER^7] Succesfully updated data for player ['..src..'] ('..GetPlayerName(src)..')')
    end
end

Players.UnloadPlayer = function(src)
    TriggerClientEvent('ltl_hud:Client:UnloadPlayer', src)
end

RegisterNetEvent('ltl_hud:Player:Prepare')
AddEventHandler('ltl_hud:Player:Prepare', function()
    local xPlayer = ESX and ESX.GetPlayerFromId(source)
    if not xPlayer then return end
    Players.SetData(source)
    TriggerClientEvent('ltl_hud:Client:LoadPlayer', source)
end)

while not FrameworkSelected do
    Wait(100)
end

RegisterNetEvent('esx:playerLoaded')
AddEventHandler('esx:playerLoaded', function(src, _, _)
    Players.SetData(src)
    TriggerClientEvent('ltl_hud:Client:LoadPlayer', src)
end)

RegisterNetEvent('esx:playerLogout')
AddEventHandler('esx:playerLogout', function(source)
    Players.UnloadPlayer(source)
end)

RegisterNetEvent('ltl_hud:Quit', function()
    DropPlayer(source, 'You have disconnected from the server.')
end)
