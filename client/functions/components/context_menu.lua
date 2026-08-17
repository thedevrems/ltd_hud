ContextMenu = {}
ContextMenu.RegisteredData = {}

function ContextMenu.Register(menuData)
    if not menuData.id then
        return debugPrint("[^2CONTEXT^7] Could not register menu. No ID has been parsed.")
    end
    ContextMenu.RegisteredData[menuData.id] = menuData
    debugPrint("[^2CONTEXT^7] Registered menu with ID [^2'" .. menuData.id .. "'^7]")
end

function ContextMenu.Open(menuId)
    if not menuId then
        return debugPrint("[^2CONTEXT^7] Could not open menu. No ID has been parsed.")
    end
    if not ContextMenu.RegisteredData[menuId] then
        return debugPrint("[^2CONTEXT^7] Could not open menu. No ID has been found in registered object.")
    end
    NUI.SendMessage("SET_CONTEXT_DATA", ContextMenu.RegisteredData[menuId])
end

local function stripFunctions(tbl)
    for k, v in pairs(tbl) do
        if type(v) == "function" then
            tbl[k] = nil
        elseif type(v) == "table" then
            stripFunctions(v)
        end
    end
end

function ContextMenu.ConvertData(options)
    for _, item in ipairs(options) do
        if type(item) == "table" then
            stripFunctions(item)
        end
    end
    return options
end

ContextMenu.Register({
    id    = "some_menu",
    title = "Some context menu",
    options = {
        { title = "Empty button" },
        { title = "Disabled button",  description = "This button is disabled", icon = "hand", disabled = true },
        {
            title       = "Example button",
            description = "Example button description",
            icon        = "circle",
            onSelect    = function() print("Pressed the button!") end,
            metadata    = {
                { label = "Value 1", value = "Some value" },
                { label = "Value 2", value = 300 },
            },
        },
        { title = "Menu button",  description = "Takes you to another menu!",                         menu = "other_menu", icon = "bars" },
        { title = "Event button", description = "Open a menu from the event and send event data",
          icon = "check", event = "test_event", arrow = true, args = { someValue = 500 } },
    }
})
