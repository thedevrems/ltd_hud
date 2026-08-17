Config.AutoStartMainMenu = true

Config.UI = {}
Config.UI.UseMusic = true
Config.UI.UseMugShotBase64 = true

Config.UI.UseConfiguration = true
Config.UI.UseInGameSettings = true
Config.UI.UseWelcomeScreen = true
Config.UI.UsePauseMenu = true
Config.UI.UseWeaponIndicator = true
Config.UI.WeaponIndicatorMode = '3d'
Config.UI.StaticPerspective = false
Config.UI.UseAIOMenu = true
Config.UI.UseListenerForMumble = true
Config.UI.Use3DVoiceIndicator = true
Config.UI.DisableVoiceIndicator = false
Config.UI.DUI3D_CheckForIntersectWorld = true
Config.UI.UseStreetLabel = true

Config.UI.UseLogoOnMinimapAnimation = true
Config.UI.UseCinematicModeOnKeybind = true
Config.UI.Use3DContent = true

Config.UI.RemoveDecimalsFromWallets = true

Config.UI.Color = {}
Config.UI.Color.AllowPrimaryColorChange = true
Config.UI.Color.AllowPrimaryBackgroundColorChange = true
Config.UI.Color.AllowBackgroundColorChange = true
Config.UI.Color.AllowInterfaceBackgroundColorChange = true
Config.UI.Color.AllowHudColorsChange = true

Config.UI.DefaultColor = '#ee1c3e'
Config.UI.DefaultPrimaryBackground = '#000000'
Config.UI.DefaultPrimaryBackgroundOpacity = .3
Config.UI.DefaultBackgroundColor = '#242424'
Config.UI.DefaultBackgroundColorOpacity = .25

Config.UI.Preset = {}

Config.UI.Preset['hud'] = {
    selected = 'basic',
    options = {
        ['3d-mode'] = false,
        ['shadows'] = false,
        ['iconShadow'] = false,
        ['smoothEdges'] = false,
        ['under50'] = false,
        ['vertical'] = false,
    },
    refreshInterval = {
        max = 1000,
        min = 10,
        current = 500,
    },
    position = {
        minimap_on = {
            x = false,
            y = false
        },
        minimap_off = {
            x = false,
            y = false,
        },
    }
}

Config.UI.Preset['carhud'] = {
    options = {
        animation = "from_right",
        shadows = false,
        strokeWidth = 29.688643641354,
    },
    position = {
        x = false,
        y = false,
    },
    refreshInterval = {
        current = 125,
        max = 250,
        min = 0,
    },
    selected = "default",
}

Config.UI.Preset['notify'] = {
    selected = 'basic',
    options = {
        ['shadows'] = false,
        ['3d-mode'] = true,
        ['list'] = false,
        ['animation'] = 'from_right'
    },
    position = {
        x = false,
        y = false,
    }
}

Config.UI.Preset['helpNotify'] = {
    selected = 'basic',
    options = {
        ['shadows'] = false,
        ['smoothEdges'] = false,
        ['background'] = false,
        ['animation'] = 'fade'
    }
}

Config.UI.Preset['progressBar'] = {
    selected = 'basic',
    position = {
        x = false,
        y = false,
    },
    options = {
        ['shadows'] = false,
        ['animation'] = 'fade',
    }
}

Config.UI.Preset['music'] = {
    url = 'https://www.youtube.com/watch?v=9RriQbnddsw',
    volume = 30,
}

Config.UI.Preset['misc'] = {
    options = {
        ['use_minimap_overlay'] = false,
        ['minimap_outline'] = false,
        ['minimap_innershadow'] = false
    }
}

Config.UI.Interfaces = {}

Config.UI.Interfaces['color'] = {
    name = 'color',
    label = 'Color',
    icon = 'fas fa-fill',
    use = true,
}

Config.UI.Interfaces['hud'] = {
    name = 'hud',
    label = 'Hud',
    icon = 'fas fa-heart',
    use = true,
}

Config.UI.Interfaces['carhud'] = {
    name = 'carhud',
    label = 'CarHud',
    icon = 'fas fa-car',
    use = true,
}

Config.UI.Interfaces['notifications'] = {
    name = 'notifications',
    label = 'Notifications',
    icon = 'fas fa-envelope-open',
    use = true,
}

Config.UI.Interfaces['helpNotify'] = {
    name = 'helpNotify',
    label = 'Help Notify',
    icon = 'fas fa-question',
    use = true,
}

Config.UI.Interfaces['progressBar'] = {
    name = 'progressBar',
    label = 'Progress Bar',
    icon = 'fas fa-circle-notch',
    use = true,
}

Config.UI.Interfaces['misc'] = {
    name = 'misc',
    label = 'Misc',
    icon = 'fas fa-cogs',
    use = true,
}

Config.UI.Interfaces['positioning'] = {
    name = 'positioning',
    label = 'Position',
    icon = 'fas fa-arrows-alt',
    use = true,
}
