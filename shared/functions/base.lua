function debugPrint(msg)
    if not Config.Debug then return end
    print("^5[INTERFACE] ^7" .. msg)
end

_Lib = {}

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
