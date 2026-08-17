Interaction = {}
Interaction.TXD    = CreateRuntimeTxd("ltl_ui_interaction_txd")
Interaction.Amount = 0
Interaction.List   = {}

function Interaction.Create(data)
    if not (data and data.options) then
        return debugPrint("Could not create interaction. No options or data has been parsed.")
    end
    if not data.coords then
        return debugPrint("Could not create interaction. No coords has been set.")
    end
    if type(data.coords) == "number" then
        if not DoesEntityExist(data.coords) then
            return debugPrint("[^1ERROR^7] Attempt to create a point for entity that does not exists!")
        end
    end

    local id     = "interaction_" .. _Lib.GenerateRandomString(10)
    local width  = math.floor(2560.0)
    local height = math.floor(1440.0)

    local duiUrl = "https://cfx-nui-" .. GetCurrentResourceName() .. "/sprites/interaction.html"
    local duiObj = CreateDui(duiUrl, width, height)
    local duiHandle = GetDuiHandle(duiObj)

    while not IsDuiAvailable(duiObj) do
        Wait(100)
    end

    local radius = data.radius or 5.0

    Interaction.List[id] = {
        id          = id,
        coords      = data.coords,
        duiObj      = duiObj,
        duiHandle   = duiHandle,
        elementData = { selected = 1, object = data.options[1] },
        data        = data,
        txn         = CreateRuntimeTextureFromDuiHandle(Interaction.TXD, id, duiHandle),
        radius      = radius,
    }

    SendDuiMessage(duiObj, json.encode({ type = "SET_COLOR", color = Storage.GetHudColor() }))
    Wait(1000)
    SendDuiMessage(duiObj, json.encode({ type = "INIT", elements = Interaction.ConvertElements(data.options) }))

    Interaction.Amount = Interaction.Amount + 1
    return id
end

function Interaction.ConvertElements(options)
    local result = {}
    for _, opt in ipairs(options) do
        table.insert(result, { label = opt.label })
    end
    return result
end

function Interaction.UpdateColor(color)
    for _, entry in pairs(Interaction.List) do
        SendDuiMessage(entry.duiObj, json.encode({ type = "SET_COLOR", color = color }))
    end
end

function Interaction.Update(data)

end

LocalPlayer.state:set("IsInteractionCooldownActive", false)
Interaction.ProgressVar = 0

function Interaction.UpdateProgress(duiObj, direction)
    if LocalPlayer.state.IsInteractionCooldownActive and direction == 1 then return end

    if direction == "ON_COOLDOWN" then
        Interaction.ProgressVar = 0
    elseif direction == 1 then
        Interaction.ProgressVar = math.min(Interaction.ProgressVar + 1, 100)
    elseif direction == 0 then
        Interaction.ProgressVar = Interaction.ProgressVar - 1
    end

    SendDuiMessage(duiObj, json.encode({ type = "UPDATE_PROGRESS", progress = Interaction.ProgressVar }))

    if Interaction.ProgressVar >= 100 then
        LocalPlayer.state:set("IsInteractionCooldownActive", true)
        Citizen.CreateThread(function()
            Wait(1000)
            debugPrint("[^2TEXTUI^7] Cooldown is not active anymore.")
            LocalPlayer.state:set("IsInteractionCooldownActive", false)
        end)
    end

    return Interaction.ProgressVar >= 100
end

function Interaction.ChangeSelectedElement(duiObj, isRight, interactionId)
    for key, entry in pairs(Interaction.List) do
        if entry.id == interactionId then
            local optionCount = #Interaction.List[key].data.options
            local current     = Interaction.List[key].elementData.selected

            local newSelected
            if isRight then
                newSelected = (current + 1 <= optionCount) and (current + 1) or 1
            else
                newSelected = (current - 1 >= 1) and (current - 1) or current
            end

            Interaction.List[key].elementData.selected = newSelected
            Interaction.List[key].elementData.object   = Interaction.List[key].data.options[newSelected]
            break
        end
    end

    SendDuiMessage(duiObj, json.encode({ type = "CHANGE_SELECTED", isRight = isRight }))
end

function Interaction.SetAsClose(duiObj, state)
    SendDuiMessage(duiObj, json.encode({ type = "SET_AS_CLOSE", state = state }))
end

function Interaction.Remove(interactionId)
    if not Interaction.List[interactionId] then
        return debugPrint("[^1ERROR^7] Can not find Interaction with ID:", interactionId)
    end
    debugPrint("[^2POINT^7] Succesfully removed Interaction with ID:", interactionId)
    Interaction.List[interactionId] = nil
    Interaction.Amount = Interaction.Amount - 1
end
