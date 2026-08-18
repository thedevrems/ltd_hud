AIO = {}

AIO.Options = {
    {
        name = 'ui_settings',
        label = "Réglages de l'interface",
        onUse = function()
            GameMenu.CreateCameraAngle()
            NUI.SendMessage('SHOW_SETTINGS', {state = true})
            NUI.SetFocus(true, true)
        end,
    },
    {
        name = 'cinematic_mode',
        label = 'Mode cinématique',
        onUse = function()
            Cinematic.Init()
        end,
    },
}
