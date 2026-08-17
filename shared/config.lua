Config = {}
Config.Debug = true
Config.DumpChangelog = false

Config.Server = {
    ['Logo'] = 'https://r2.fivemanage.com/9fHGnEBEfnR89IeQ0njaD/Vector4.png',
    ['Name'] = 'My Server Name'
}

Config.DefaultMusic = 'https://www.youtube.com/watch?v=lh4JdZTJe7k&ab_channel=SoothingRelaxation'
Config.Currency = 'USD'
Config.Metrics = 'mph'
Config.UseSeatbelt = true
Config.PersistentMinimap = false
Config.PersistentStreetLabel = false
Config.AwaitShutdownLoadingScreen = false
Config.UseAutomaticOptimizationCheck = true
Config.UseTotalAmmoOnWeaponIndicator = true
Config.DisablePauseMenuInterval = 2
Config.DisableMinimapHandler = false
Config.DisableMinimapAnimation = false
Config.UseMusicInMulticharacter = true

Config.BringPlayerAfterWelcomeScreenToInitialCoords = false

Config.HideComponents = {
    [1] = true,
    [2] = true,
    [3] = true,
    [4] = true,
    [5] = true,
    [6] = true,
    [7] = true,
    [8] = true,
    [9] = true,
    [10] = true,
    [11] = true,
    [12] = true,
    [13] = true,
    [14] = false,
    [15] = true,
    [16] = true,
    [17] = true,
    [18] = true,
    [19] = true,
    [20] = true,
    [21] = true,
    [22] = true,
}

Config.RemoveFeedsAndDefaultNotifications = true
Config.HandleUIVisibilityOnBaseEvents = true

Config.KeyBinds = {
    ['menu'] = {
        description = 'UI Menu',
        key = 'F9',
        use = true,
    }, ['cancel_progressbar'] = {
        description = 'Cancel Progressbar',
        key = 'X',
        use = true,
    }, ['aio_menu'] = {
        description = 'AIO Menu',
        key = 'F1',
        use = true,
    }, ['seatbelt'] = {
        description = 'Seatbelt',
        key = 'B',
        use = true,
    }, ['cinematic_mode'] = {
        description = 'Open Cinematic Mode',
        key = 'F6',
        use = true,
    }, ['cinematic_focus'] = {
        description = 'Click to focus on Cinematic Mode',
        key = 'LSHIFT',
        use = true,
    }, ['3d_perspective'] = {
        description = 'Show 3D Perspective',
        key = 'TAB',
        use = true,
    }
}

Config.Commands = {
    ['menu'] = 'menu',
    ['cancel_progress'] = 'cancel_progressbar',
    ['aio_menu'] = 'aio_menu',
    ['seatbelt'] = 'seatbelt',
    ['cinematic_mode'] = 'cinematic_mode',
    ['cinematic_focus'] = 'cinematic_focus',
    ['3d_perspective'] = 'hidden_content',
}

Config.UsePerspective = true

Config.UseOptimalValues = false

Config.WeaponBlacklist = {
    ['weapon_bat'] = true,
}

Config.BlacklistedVehicles = {

}

Config.CommandGroupAllowed = 'admin'
