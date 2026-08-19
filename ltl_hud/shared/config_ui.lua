Config.AutoStartMainMenu = true

Config.UI = {}
Config.UI.UseMusic = true
Config.UI.UseMugShotBase64 = true

Config.UI.UseConfiguration = true
Config.UI.UseInGameSettings = true
Config.UI.UseWelcomeScreen = true
-- N'afficher la scène d'intro « Appuyez sur ENTRÉE » que tant que le compte n'a
-- pas de HUD enregistré dans `ltl_hud_settings`. Mettre à false pour la jouer à
-- chaque connexion, comme une intro de serveur.
Config.UI.WelcomeScreenOnFirstRunOnly = true
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

-- Le HUD que voit un compte SANS ligne dans `ltl_hud_settings`. Un compte qui en
-- a une ne voit jamais ces valeurs : bootstrap.js recouvre le préréglage avec le
-- document du joueur, clé par clé.
--
-- Ces blocs ont été relevés sur un HUD réglé à la main, sur un écran 1920x1080.
-- Les positions sont donc en vw/vh et non en pixels : figées en pixels, elles
-- arriveraient décalées sur tout autre format, et hors écran sur une partie.
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
        min = 0,
        current = 100,
    },
    scale = 0.95653495440729,
    position = {
        minimap_on = {
            x = '17.0vw',
            y = '91.7vh',
        },
        minimap_off = {
            x = '1.3vw',
            y = '80.3vh',
        },
    }
}

Config.UI.Preset['carhud'] = {
    selected = 'default',
    options = {
        ['animation'] = 'from_right',
        ['shadows'] = false,
        ['strokeWidth'] = 29.688643641354,
    },
    refreshInterval = {
        max = 250,
        min = 0,
        current = 125,
    },
    scale = 1,
    position = {
        x = '83.3vw',
        y = '71.2vh',
    },
}

Config.UI.Preset['notify'] = {
    selected = 'basic',
    options = {
        ['shadows'] = false,
        ['3d-mode'] = true,
        ['list'] = false,
        ['animation'] = 'from_right'
    },
    -- `false` veut dire « là où le css le pose », et non « en haut à gauche » :
    -- ce composant n'a jamais été déplacé, donc il garde sa place d'origine.
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
    options = {
        ['shadows'] = false,
        ['animation'] = 'fade',
    },
    scale = 1.0468967545838,
    position = {
        x = '43.6vw',
        y = '92.7vh',
    },
}

-- Piste jouée sous le menu principal tant que le compte n'a pas fourni la
-- sienne sur l'écran « thème musical ». Le bloc est OBLIGATOIRE même avec
-- Config.UI.UseMusic à false : applyMusicFallbacks() lit `Preset.music.url`
-- sans garde, et le retirer ferait échouer tout le démarrage de la page.
Config.UI.Preset['music'] = {
    url = 'https://www.youtube.com/watch?v=9RriQbnddsw',
    volume = 30,
}

Config.UI.Preset['misc'] = {
    options = {
        ['use_minimap_overlay'] = false,
        ['minimap_outline'] = false,
        ['minimap_innershadow'] = false,
        -- Recouvert par Config.Chat.Size tant que Config.Chat.AllowUserChangeSize
        -- est false ; les deux valent 'small', donc les deux chemins concordent.
        ['chat_size'] = 'small',
    }
}

Config.UI.Interfaces = {}

Config.UI.Interfaces['color'] = {
    name = 'color',
    label = 'Couleurs',
    icon = 'fas fa-fill',
    use = true,
}

Config.UI.Interfaces['hud'] = {
    name = 'hud',
    label = 'HUD',
    icon = 'fas fa-heart',
    use = true,
}

Config.UI.Interfaces['carhud'] = {
    name = 'carhud',
    label = 'Véhicule',
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
    label = "Notification d'aide",
    icon = 'fas fa-question',
    use = true,
}

Config.UI.Interfaces['progressBar'] = {
    name = 'progressBar',
    label = 'Barre de progression',
    icon = 'fas fa-circle-notch',
    use = true,
}

Config.UI.Interfaces['misc'] = {
    name = 'misc',
    label = 'Divers',
    icon = 'fas fa-cogs',
    use = true,
}

Config.UI.Interfaces['positioning'] = {
    name = 'positioning',
    label = 'Position',
    icon = 'fas fa-arrows-alt',
    use = true,
}
