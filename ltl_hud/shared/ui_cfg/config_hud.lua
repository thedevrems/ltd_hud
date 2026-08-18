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
        label = 'Basique',
    },
    ['skew'] = {
        use = true,
        label = 'Incliné',
    },
    ['diamond'] = {
        use = true,
        label = 'Losange'
    },
    ['circle'] = {
        use = true,
        label = 'Cercle'
    },
    ['modern'] = {
        use = true,
        label = 'Moderne'
    },
    ['hexagon'] = {
        use = true,
        label = 'Hexagone'
    },
    ['square'] = {
        use = true,
        label = 'Carré'
    },
}
