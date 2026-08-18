RegisterCommand(Config.Commands.menu, function()
    if not Config.UI.UseInGameSettings then return end
    DisplayRadar(false, true)
    GameMenu.CreateCameraAngle()
    NUI.SendMessage("SHOW_SETTINGS", { state = true })
    NUI.SetFocus(true, true)
end)

CreateThread(function()
    LocalPlayer.state:set("UI_InSettings", false)
    TriggerServerEvent("ltl_hud:Player:Prepare")
    Config.MusicHandlerUpdated = true
end)
