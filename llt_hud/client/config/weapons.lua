GetWeaponAmmo = function(ped, weaponHash)
    local ammo
    if Config.UseTotalAmmoOnWeaponIndicator then
        ammo = GetAmmoInPedWeapon(ped, weaponHash)
    else
        ammo = GetAmmoInClip(ped, weaponHash)
    end
    return ammo
end
