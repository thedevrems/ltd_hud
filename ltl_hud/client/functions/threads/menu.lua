Threads.Menu = {}
Threads.Menu.Use = false

function Threads.Menu.Init()
    Threads.Menu.Use = true
    CreateThread(function()
        while Threads.Menu.Use do
            if IsControlJustPressed(0, 172) then
                NUI.SendMessage("MENU_ON_CHANGE", { isArrowUp = false })
            elseif IsControlJustPressed(0, 173) then
                NUI.SendMessage("MENU_ON_CHANGE", { isArrowUp = true })
            elseif IsControlJustPressed(0, 177) then
                Menu.ForceClose()
            elseif IsControlJustPressed(0, 191) then
                NUI.SendMessage("ON_MENU_SELECT", {})
            end
            Wait(0)
        end
    end)
end

function Threads.Menu.Disable()
    Threads.Menu.Use = false
end
