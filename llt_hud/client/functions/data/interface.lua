Data.Interface = {
    color       = {},
    hud         = {},
    carhud      = {},
    notify      = {},
    progressbar = {},
    minimap     = {},
}

function Data.Interface.Get(componentName, fieldName)
    local component = Data.Interface[componentName]
    if component and component[fieldName] then
        return component[fieldName]
    end
    return "NO_DATA_FOUND"
end
