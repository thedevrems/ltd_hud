function debugPrint(msg)
    if not Config.Debug then return end
    print("^5[INTERFACE] ^7" .. msg)
end

-- Scoped trace channel. Every line carries the same tag so one filter isolates
-- a single flow (WELCOME, PRESETS, VISIBILITY) out of the whole console.
Debug = {}

-- Set a scope to false here to silence just that one without touching Config.Debug.
Debug.Scopes = {}

function Debug.IsEnabled(scope)
    if not Config or not Config.Debug then return false end
    return Debug.Scopes[scope] ~= false
end

function Debug.Print(scope, msg, ...)
    if not Debug.IsEnabled(scope) then return end
    local body = msg
    if select("#", ...) > 0 then
        local ok, formatted = pcall(string.format, msg, ...)
        body = ok and formatted or msg
    end
    print(("^5[INTERFACE]^7 [^3%s^7] %s"):format(scope, body))
end

-- Colours a boolean so a wrong flag stands out while skimming the console.
function Debug.Bool(value)
    if value == nil then return "^8nil^7" end
    return value and "^2true^7" or "^1false^7"
end

function Debug.Dump(scope, label, value)
    if not Debug.IsEnabled(scope) then return end
    local ok, encoded = pcall(json.encode, value)
    Debug.Print(scope, "%s = %s", label, ok and encoded or tostring(value))
end

_Lib = {}

-- First name in the list that is actually running, or nil. Used to find which
-- multicharacter resource a server ships without hardcoding a single one.
function _Lib.GetStartedResource(names)
    if type(names) ~= "table" then return nil end
    for i = 1, #names do
        if GetResourceState(names[i]) == "started" then return names[i] end
    end
    return nil
end

function _Lib.GenerateRandomString(length)
    local chars = {}
    for _ = 1, length do
        local kind = math.random(1, 2)
        local char
        if kind == 1 then
            char = string.char(math.random(65, 90))
        else
            char = tostring(math.random(0, 9))
        end
        table.insert(chars, char)
    end
    return table.concat(chars)
end

function _Lib.ConvertArgumentsToString(args)
    local result = ""
    for _, v in ipairs(args) do
        result = result .. " " .. v
    end
    return result
end
