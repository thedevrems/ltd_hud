Config.Hud = {}
Config.Hud.Use = true

Config.Hud.Order = {
    'health', 'armour', 'hunger', 'thirst'
}

Config.Hud.Status = {}

Config.Hud.Status['health'] = {
    name = 'health',
    icon = 'fas fa-heart',
    value = 0,
    isVisible = true,
}

Config.Hud.Status['armour'] = {
    name = 'armour',
    icon = 'fas fa-vest',
    value = 0,
    isVisible = true,
}

Config.Hud.Status['hunger'] = {
    name = 'hunger',
    icon = 'fas fa-hamburger',
    value = 0,
    isVisible = true,
}

Config.Hud.Status['thirst'] = {
    name = 'thirst',
    icon = 'fas fa-glass-whiskey',
    value = 0,
    isVisible = true,
}

Config.Hud.Types = {
    ['basic'] = {
        use = true,
        label = 'Basic',
    },
    ['skew'] = {
        use = true,
        label = 'Skew',
    },
    ['diamond'] = {
        use = true,
        label = 'Diamond'
    },
    ['circle'] = {
        use = true,
        label = 'Circle'
    },
    ['modern'] = {
        use = true,
        label = 'Modern'
    },
    ['hexagon'] = {
        use = true,
        label = 'Hexagon'
    },
    ['square'] = {
        use = true,
        label = 'Square'
    },
}
