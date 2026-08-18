-- Efface la ligne du compte dans `ltl_hud_settings` en plus de vider la page :
-- ne remettre à zéro que la NUI laisserait le HUD revenir tel quel au prochain
-- SEND_FULL_CFG, puisque la base reste la source de vérité.
RegisterCommand('remove_nui_storage', function()
    Storage.Remove()
end)

MapIsOpen = false

RegisterCommand('open_map', function()
    MapIsOpen = true
    NUI.SetRoutePath('/blank')
    ActivateFrontendMenu(GetHashKey('FE_MENU_VERSION_MP_PAUSE'), 0, -1)
    if not IsPauseMenuActive() or IsPauseMenuRestarting() then
        while not IsPauseMenuActive() or IsPauseMenuRestarting() do
            Wait(0)
        end
    end
    CreateThread(function()
        Wait(50)
        PauseMenuceptionGoDeeper(0)
        PauseMenuceptionTheKick()
    end)
    DisplayRadar(false, true)
    StartAudioScene('DEATH_SCENE')

    while IsPauseMenuActive() do
        if IsControlJustPressed(0, 200) or IsControlJustPressed(0, 177) or IsControlJustPressed(0, 202) then
            SetFrontendActive(0)
            break
        end
        Citizen.Wait(0)
    end

    MapIsOpen = false
    StopAudioScene('DEATH_SCENE')
    NUI.SetRoutePath('/')

    local inVehicle = Threads.Vehicles.Data.vehicle ~= 0
    if Config.PersistentMinimap or inVehicle then
        DisplayRadar(true)
    end

    if inVehicle and Config.UI.UseStreetLabel then
        StreetLabel.SetVisible(true)
        if not Threads.Vehicles.StreetLabelUse then
            Threads.Vehicles.StreetLabel()
        end
    end
end)

RegisterKeyMapping('open_map', 'Ouvrir la carte', 'KEYBOARD', 'P')

if not Config.Chat.Use then return debugPrint('Removing commands.') end

RegisterCommand('me', function(src, args, _)
    local argsOutput = _Lib.ConvertArgumentsToString(args)
    Chat.CreateMessage('ME', argsOutput, '#c94b5b', true, 10.0)
end)

RegisterCommand('do', function(src, args, _)
    local argsOutput = _Lib.ConvertArgumentsToString(args)
    Chat.CreateMessage('DO', argsOutput, '#1A1A1A', true, 10.0)
end)

RegisterCommand('twt', function(src, args, _)
    local argsOutput = _Lib.ConvertArgumentsToString(args)
    Chat.CreateMessage('fab fa-twitter', argsOutput, '#64A6FD', false, false)
end)

LocalOutOfCharacter = function(message)
    if not message or message == '' then return end
    Chat.CreateMessage('fas fa-globe', message, '#0c0c0cd9', false, 10.0)
end
