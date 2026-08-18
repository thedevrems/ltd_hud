Config.PauseMenu = {}
Config.PauseMenu.Style = 'default'

Config.PauseMenu.NavbarElements = {
    ['youtube'] = {
        label = 'YouTube',
        icon = 'fab fa-youtube',
        url = 'https://www.youtube.com/@ZSXDevelopment',
        use = true,
    },
    ['store'] = {
        label = 'Store',
        icon = 'fas fa-globe',
        url = 'https://www.mywebsite.com',
        use = true,
    },
    ['discord'] = {
        label = 'Discord',
        icon = 'fab fa-discord',
        url = 'https://discord.gg',
        use = true,
    },
}

Config.PauseMenu.UserData = {
    ['mugshot'] = true,
    ['user_firstname_and_lastname'] = true,
    ['job_list'] = true,
    ['wallets_list'] = true
}

Config.PauseMenu.UseCustomOrder = true

Config.PauseMenu.Order = {
    'ui', 'settings', 'map'
}

Config.PauseMenu.Buttons = {
    ['ui'] = {
        name = 'ui',
        label = 'UI Settings',
        path = {
            type = 'UISettings',
        },
        icon = 'UI',
    },
    ['settings'] = {
        name = 'settings',
        label = 'Game Settings',
        path = {
            type = 'game',
            value = 'settings',
        },
        icon = 'fas fa-cog',
    },
    ['map'] = {
        name = 'map',
        label = 'Map',
        path = {
            type = 'game',
            value = 'map',
        },
        icon = 'fas fa-map',
    }
}
