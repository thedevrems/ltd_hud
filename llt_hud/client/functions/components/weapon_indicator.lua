WeaponIndicator = {}

function WeaponIndicator.SetAsActive(state)
    NUI.SendMessage("SET_WEAPON_INDICATOR_AS_ACTIVE", { state = state })
end

function WeaponIndicator.SetName(name)
    NUI.SendMessage("SET_WEAPON_INDICATOR_NAME", { name = name })
end

function WeaponIndicator.SetAmmo(current, max, magazine)
    NUI.SendMessage("SET_WEAPON_INDICATOR_AMMO", { current = current, max = max, magazine = magazine })
end
