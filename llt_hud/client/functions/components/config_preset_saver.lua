local function isValidIdentifier(str)
    return str:match("^[A-Za-z_][A-Za-z0-9_]*$")
end

local function quoteString(str)
    return string.format("%q", str)
end

local function serializeValue(value, indent, orderedKeys)
    local t = type(value)
    if t == "table" then
        return table_to_string(value, indent, orderedKeys)
    elseif t == "string" then
        return quoteString(value)
    else
        return tostring(value)
    end
end

function table_to_string(tbl, indent, orderedKeys)
    if not indent then indent = 0 end

    local indent1 = string.rep("    ", indent)
    local indent2 = indent1 .. "    "
    local parts   = {"{"}
    local seen     = {}
    local keys     = {}

    if orderedKeys then
        for _, k in ipairs(orderedKeys) do
            if tbl[k] ~= nil then
                table.insert(keys, k)
                seen[k] = true
            end
        end
    end

    for k in pairs(tbl) do
        if not seen[k] then
            table.insert(keys, k)
        end
    end

    table.sort(keys, function(a, b) return tostring(a) < tostring(b) end)

    for _, k in ipairs(keys) do
        local v   = tbl[k]
        local key

        if type(k) == "string" then
            key = isValidIdentifier(k) and k or ("['" .. k .. "']")
        else
            key = "[" .. tostring(k) .. "]"
        end

        local serialisedVal = serializeValue(v, indent + 1, orderedKeys)
        table.insert(parts, indent2 .. key .. " = " .. serialisedVal .. ",")
    end

    table.insert(parts, indent1 .. "}")
    return table.concat(parts, "\n")
end

function serialize(tbl, name, orderedKeys)
    local body = table_to_string(tbl, 0, orderedKeys)
    if name then
        return name .. " = " .. body
    end
    return body
end

local function tableKeys(tbl)
    local keys = {}
    for k in pairs(tbl) do table.insert(keys, k) end
    return keys
end

RegisterCommand("get_config_preset", function(src, args)
    local interfaceName = args[1]
    local ifaceData     = Storage.Data[interfaceName]

    if not ifaceData then
        return debugPrint("[^2PRESET_GEN^7] Error. Could not find any interface named ^1"
            .. interfaceName .. "^7")
    end

    local output = {}
    output.selected = ifaceData.selected
    output.options  = ifaceData.options

    if ifaceData.refreshInterval then
        output.refreshInterval = ifaceData.refreshInterval
    end

    if ifaceData.position then
        local screenW, screenH = GetActualScreenResolution()

        if interfaceName == "hud" then
            output.position = {
                minimap_on  = Math.Pixels_to_viewport(ifaceData.position.minimap_on,  screenW, screenH),
                minimap_off = Math.Pixels_to_viewport(ifaceData.position.minimap_off, screenW, screenH),
            }
        else
            output.position = Math.Pixels_to_viewport(ifaceData.position, screenW, screenH)
        end
    end

    local orderedKeys = tableKeys(output)
    local result      = serialize(output, "Config.UI.Preset['" .. interfaceName .. "']", orderedKeys)

    print("\n\n\n\n\n")
    debugPrint("[^2PRESET_GEN^7] Copy the content and replace it in /shared/config_ui.lua for ^2Config.UI.Preset[\""
        .. interfaceName .. "\"]")
    print("\n\n\n")
    print(result)
end)
