Menu = {}
Menu.Visible = false

function Menu.Init()
    if not Config.UI.UseAIOMenu then return end
    Menu.Visible = not Menu.Visible

    if Menu.Visible then
        if PauseMenu.SomePartIsStillOpening then return end
        if Storage.CurrentScreen ~= "game" then return end
    end

    NUI.SendMessage("SHOW_MENU", { state = Menu.Visible })

    if Menu.Visible then
        Threads.Menu.Init()
    else
        Threads.Menu.Disable()
    end
end

function Menu.ForceClose()
    NUI.SendMessage("SHOW_MENU", { state = false })
    Menu.Visible = false
    Threads.Menu.Disable()
end

RegisterNUICallback("menu.onSelect", function(data)
    for _, option in ipairs(AIO.Options) do
        if option.name == data.name then
            option.onUse()
            Menu.ForceClose()
            break
        end
    end
end)

function Menu.SetData(options)
    if not Config.UI.UseAIOMenu then return end
    local stripped = {}
    for _, opt in ipairs(options) do
        table.insert(stripped, { label = opt.label, name = opt.name })
    end
    NUI.SendMessage("SET_MENU_DATA", stripped)
end

if Config.UI.UseAIOMenu then
    RegisterCommand(Config.Commands.aio_menu, function()
        Menu.Init()
    end)
end
