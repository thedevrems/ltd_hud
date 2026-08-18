local function ReadFile(dir)
    local file = io.open(dir, "r")
    if not file then
        debugPrint("[^3AUTO-INSTALL^7] [^1ERROR^0] Cannot find '" .. dir .. "' file.")
        return nil
    end
    local content = file:read("*all")
    file:close()
    return content
end

local function OverwriteFile(dir, payload, outputSuccess)
    local file = io.open(dir, "w")
    if not file then
        debugPrint("[^3AUTO-INSTALL^7] [^1ERROR^0] Failed to open '" .. dir .. "' for writing.")
        return
    end
    file:write(payload)
    file:close()
    debugPrint('[^3AUTO-INSTALL^7] ' .. outputSuccess)
end

RegisterCommand('install_ox_lib_compatibility', function(src, _, _)
    if src ~= 0 then return end
    local UIName = GetCurrentResourceName()
    local UIDir = GetResourcePath(UIName)
    local payloads = {
        ox_lib = {
            progressbar = ReadFile((UIDir:gsub(".*resources", "resources"))..'/server/autoinstall/code_variables/ox_lib_progressbar.lua'),
            notification = ReadFile((UIDir:gsub(".*resources", "resources"))..'/server/autoinstall/code_variables/ox_lib_notification.lua'),
        },
    }
    debugPrint('[^3AUTO-INSTALL^7] Preparing ^3ox_lib^7 compatibility [/]')
    local dir = GetResourcePath('ox_lib')
    OverwriteFile((dir:gsub(".*resources", "resources"))..'/resource/interface/client/progress.lua', payloads.ox_lib.progressbar, '[^3OX_LIB^7] [^4PROGRESSBAR^7] Succesfully updated the file')
    OverwriteFile((dir:gsub(".*resources", "resources"))..'/resource/interface/client/notify.lua', payloads.ox_lib.notification, '[^3OX_LIB^7] [^4NOTIFICATION^7] Succesfully updated the file')
end)
