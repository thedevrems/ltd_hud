AIO = {}

AIO.Options = {
    {
        name = 'ui_settings',
        label = 'UI Settings',
        onUse = function()
            GameMenu.CreateCameraAngle()
            NUI.SendMessage('SHOW_SETTINGS', {state = true})
            NUI.SetFocus(true, true)
        end,
    },
    {
        name = 'cinematic_mode',
        label = 'Cinematic Mode',
        onUse = function()
            Cinematic.Init()
        end,
    },
}
