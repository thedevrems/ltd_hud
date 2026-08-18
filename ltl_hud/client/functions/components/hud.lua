Hud = {}

function Hud.UpdateKeyValue(key, value)
    NUI.SendMessage("UPDATE_HUD_VALUE", { key = key, value = value })
end

Status = {}
Status.Memory = {}

local function waitForNUI()
    while not NUI.Loaded or not Storage.HasBeenSent do
        Wait(1000)
    end
end

function Status.RegisterStatus(name, icon, initialValue, getFunction)
    waitForNUI()

    if Config.Hud.Status[name] then
        return debugPrint(string.format("[^2STATUS^7] [^1REGISTER^7] There is already status registered with name [^2%s^7]", name))
    end
    if Status.Memory[name] then
        return debugPrint(string.format("[^2STATUS^7] [^1REGISTER^7] There is already pending status to be registered with name [^2%s^7]", name))
    end
    if not getFunction then
        return debugPrint(string.format("[^2STATUS^7] [^1REGISTER^7] Param ^1getFunction^7 is not defined for status with name [^2%s^7]", name))
    end
    if type(getFunction) ~= "function" then
        return debugPrint(string.format("[^2STATUS^7] [^1REGISTER^7] Param ^1getFunction^7 is not a function for status with name [^2%s^7]", name))
    end
    if getFunction() == nil then
        return debugPrint(string.format("[^2STATUS^7] [^1REGISTER^7] Param ^1getFunction^7 does not return anything for status with name [^2%s^7]", name))
    end
    if type(getFunction()) ~= "number" then
        return debugPrint(string.format("[^2STATUS^7] [^1REGISTER^7] Param ^1getFunction^7 does not return a number for status with name [^2%s^7]", name))
    end

    local value = initialValue or 0
    Status.Memory[name] = { name = name, icon = icon, value = value, isVisible = true, get = getFunction }

    NUI.SendMessage("HANDLE_REGISTER_STATUS_HUD", {
        register     = true,
        statusName   = name,
        statusData   = { name = name, icon = icon, value = value, isVisible = true },
        statusVisible = true,
    })
end

function Status.UnregisterStatus(name)
    waitForNUI()

    if not Config.Hud.Status[name] then
        return debugPrint(string.format("[^2STATUS^7] [^1UNREGISTER^7] Could not find any status with name [^2%s^7]", name))
    end
    NUI.SendMessage("HANDLE_REGISTER_STATUS_HUD", {
        register   = false,
        statusName = name,
        statusData = {},
    })
end

RegisterNUICallback("status.onRegister", function(data)
    Config.Hud.Status[data.statusName] = Status.Memory[data.statusName]
    debugPrint(string.format("[^2STATUS^7] [^2REGISTER^7] Registered status with name [^2%s^7]", data.statusName))
    Status.Memory[data.statusName] = nil
end)

RegisterNUICallback("status.onUnregister", function(data)
    Config.Hud.Status[data.statusName] = nil
    debugPrint(string.format("[^2STATUS^7] [^2UNREGISTER^7] Unregistered status with name [^2%s^7]", data.statusName))
end)
