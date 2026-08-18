Threads.Hud = {}
Threads.Hud.Use             = false
Threads.Hud.RefreshInterval = Config.UI.Preset.hud.refreshInterval
Threads.Hud.Data            = {}

local hudCache = {}

local function cacheChanged(key, newValue)
    local old = hudCache[key]
    if old == nil then
        hudCache[key] = newValue
        return true
    end
    if type(newValue) == "number" and type(old) == "number" then
        if math.abs(newValue - old) > 1 then
            hudCache[key] = newValue
            return true
        end
        return false
    end
    if old ~= newValue then
        hudCache[key] = newValue
        return true
    end
    return false
end

function Threads.Hud.Init()
    if not Config.Hud.Use then return end
    Threads.Hud.Use = true

    while not FrameworkSelected do
        Wait(100)
    end

    CreateThread(function()
        debugPrint("[^6THREADS^7] HUD interval set to ^2"
            .. math.floor(Threads.Hud.RefreshInterval.current) .. "ms^7")

        while Threads.Hud.Use do
            for _, statusEntry in pairs(Config.Hud.Status) do
                if statusEntry and statusEntry.get then
                    local ok, value = pcall(statusEntry.get)
                    if ok and value ~= nil then
                        if cacheChanged(statusEntry.name, value) then
                            Hud.UpdateKeyValue(statusEntry.name, value)
                        end
                    end
                end
            end
            Wait(math.floor(Threads.Hud.RefreshInterval.current))
        end
    end)
end
