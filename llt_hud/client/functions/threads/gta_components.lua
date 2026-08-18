Threads.Components = {}

function Threads.Components.Init()
    Citizen.CreateThread(function()
        SetPedConfigFlag(PlayerPedId(), 48, true)

        for idx, shouldHide in ipairs(Config.HideComponents) do
            if shouldHide then
                SetHudComponentPosition(idx, -5.0, -5.0)
            end
        end

        if Config.RemoveFeedsAndDefaultNotifications then
            while true do
                ThefeedHideThisFrame()
                Citizen.Wait(10)
            end
        end
    end)
end
