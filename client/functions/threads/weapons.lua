Threads.Weapon = {}
Threads.Weapon.Use         = false
Threads.Weapon.HashList    = {}
Threads.Weapon.BlackListHash = {}

Threads.Weapon.Data = {
    weapon       = -1,
    ammo         = { current = 0, max = 0, magazine = 0 },
    isPedAiming  = false,
}

function Threads.Weapon.Init()
    if not Config.UI.UseWeaponIndicator then return end
    Threads.Weapon.Use = true

    Citizen.CreateThread(function()
        local idleInterval = Config.Intervals.weapon.idle

        for name, label in pairs(Translations.Weapons) do
            Threads.Weapon.HashList[tostring(GetHashKey(name))] = label
        end

        for name in pairs(Config.WeaponBlacklist) do
            Threads.Weapon.BlackListHash[tostring(GetHashKey(name))] = true
        end

        Threads.Weapon.Data.isPedAiming = false

        while Threads.Weapon.Use do
            local isAiming = IsAimCamActive() == 1
            local data     = Threads.Weapon.Data

            if data.isPedAiming ~= isAiming then
                data.isPedAiming = isAiming
                local showWeapon = isAiming

                if isAiming then
                    local hash    = GetSelectedPedWeapon(Threads.Players.Data.ped)
                    local unarmed = GetHashKey("weapon_unarmed")

                    if hash ~= unarmed then
                        local hashKey = tostring(hash)
                        if not Threads.Weapon.BlackListHash[hashKey] then

                            data.weapon = hash
                            WeaponIndicator.SetName(Threads.Weapon.HashList[hashKey])
                        else
                            showWeapon = false
                        end
                    else
                        showWeapon = false
                    end
                end

                WeaponIndicator.SetAsActive(showWeapon)
            end

            if data.isPedAiming then
                local ped    = Threads.Players.Data.ped
                local weapon = data.weapon
                local _, currentAmmo = GetAmmoInClip(ped, weapon)

                data.ammo = {
                    current  = currentAmmo,
                    max      = GetWeaponClipSize(weapon),
                    magazine = GetWeaponAmmo(ped, weapon),
                }
                WeaponIndicator.SetAmmo(data.ammo.current, data.ammo.max, data.ammo.magazine)
                idleInterval = Config.Intervals.weapon.active
            else
                idleInterval = Config.Intervals.weapon.idle
            end

            Wait(idleInterval)
        end
    end)
end
