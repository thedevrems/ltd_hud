HelpNotify = {}
HelpNotify.IsATask = false
HelpNotify.IsActive = false
HelpNotify.IsOnTickStarted = false
HelpNotify.TasksList = {}
HelpNotify.ExpiryTime = false

if Config.HelpNotify.Use then
    CreateThread(function()
        while true do
            if HelpNotify.ExpiryTime then
                if HelpNotify.ExpiryTime - GetGameTimer() < 0 then
                    HelpNotify.Remove()
                    HelpNotify.IsOnTickStarted = false
                end
            end
            Wait(500)
        end
    end)
end

local function validateAndParseTasks(taskList)
    local hasActiveStage = false
    for index, stage in ipairs(taskList) do
        if not stage.name or stage.name == "" then
            return false, ("[^2HELPNOTIFICATION^7] Missing parameter ^1name^7 for id: [^1" .. index .. "^7].")
        end
        if not stage.text or stage.text == "" then
            return false, ("[^2HELPNOTIFICATION^7] Missing parameter ^1text^7 for id: [^1" .. index .. "^7].")
        end
        if InputParser and InputParser.ParseInputs then
            stage.text = InputParser.ParseInputs(stage.text) or stage.text
        end
        if stage.active and not hasActiveStage then
            hasActiveStage = true
        end
    end
    if not hasActiveStage then
        return false, "[^2HELPNOTIFICATION^7] Missing parameter ^1active^7 or is wrongly indexed."
    end
    return true
end

function HelpNotify.Add(notifyData)
    if not Config.HelpNotify.Use then return end
    HelpNotify.IsATask = false
    HelpNotify.TasksList = {}

    if type(notifyData.text) == "table" then
        HelpNotify.IsATask = true
        HelpNotify.TasksList = notifyData.text
        local ok, err = validateAndParseTasks(notifyData.text)
        if not ok then return debugPrint(err) end
    else
        if InputParser and InputParser.ParseInputs then
            notifyData.text = InputParser.ParseInputs(notifyData.text) or notifyData.text
        end
    end

    TriggerEvent("ltl_hud:Interfaces:HelpNotification:OnAdd")
    NUI.SendMessage("ADD_HELP_NOTIFY", notifyData)
end

function HelpNotify.OnTick(notifyData)
    if not Config.HelpNotify.Use then return end

    if HelpNotify.IsActive then
        HelpNotify.ExpiryTime = GetGameTimer() + 500
    end

    HelpNotify.IsOnTickStarted = true
    HelpNotify.IsActive = true
    HelpNotify.IsATask = false
    HelpNotify.TasksList = {}
    HelpNotify.ExpiryTime = GetGameTimer() + 500

    if type(notifyData.text) == "table" then
        HelpNotify.IsATask = true
        HelpNotify.TasksList = notifyData.text
        local ok, err = validateAndParseTasks(notifyData.text)
        if not ok then return debugPrint(err) end
    else
        if InputParser and InputParser.ParseInputs then
            notifyData.text = InputParser.ParseInputs(notifyData.text) or notifyData.text
        end
    end

    NUI.SendMessage("ADD_HELP_NOTIFY", notifyData)
end

function HelpNotify.UpdateStage(stageData)
    if not HelpNotify.IsATask then
        return debugPrint("[^2HELPNOTIFICATION^7] Could not update a stage.")
    end
    NUI.SendMessage("UPDATE_HELP_NOTIFY_STAGE", stageData)
end

function HelpNotify.UpdateText(newText)
    if HelpNotify.IsATask then
        return debugPrint("[^2HELPNOTIFICATION^7] Could not update a text. Current Help Notification is not a task listed, you should use ^2exports[\"ltl_hud\"]:HelpNotification_UpdateTextTask^7 instead")
    end
    local displayText = (InputParser and InputParser.ParseInputs and InputParser.ParseInputs(newText)) or newText
    NUI.SendMessage("UPDATE_HELP_NOTIFY_TEXT", { text = displayText })
end

function HelpNotify.UpdateTextTask(stageName, newText)
    if not HelpNotify.IsATask then
        return debugPrint("[^2HELPNOTIFICATION^7] Could not update a text. Current Help Notification is not a task listed, you should use ^2exports[\"ltl_hud\"]:HelpNotification_UpdateTextTask^7 instead")
    end
    local displayText = (InputParser and InputParser.ParseInputs and InputParser.ParseInputs(newText)) or newText

    local found = false
    for index, stage in ipairs(HelpNotify.TasksList) do
        if stage.name == stageName then
            HelpNotify.UpdateStage({ stage = index, key = "text", value = displayText })
            found = true
            break
        end
    end
    if not found then
        debugPrint("[^2HELPNOTIFICATION^7] Could not update a text. There is no stage named: " .. stageName)
    end
end

function HelpNotify.SetStageAsActive(stageName)
    if not HelpNotify.IsATask then
        return debugPrint("[^2HELPNOTIFICATION^7] Could not update a stage.")
    end
    local found = false
    for _, stage in ipairs(HelpNotify.TasksList) do
        if stage.name == stageName then found = true break end
    end
    if not found then
        return debugPrint("[^2HELPNOTIFICATION^7] Could not a find stage with name ^1" .. stageName .. "^7")
    end

    for index, stage in ipairs(HelpNotify.TasksList) do
        if stage.active and stage.name ~= stageName then
            HelpNotify.UpdateStage({ stage = index, key = "active", value = false })
        end
        if stage.name == stageName then
            HelpNotify.UpdateStage({ stage = stageName, key = "active", value = true })
            break
        end
    end
end

function HelpNotify.SetStageAsCompleted(stageName)
    if not HelpNotify.IsATask then
        return debugPrint("[^2HELPNOTIFICATION^7] Could not update a stage.")
    end
    local found = false
    for _, stage in ipairs(HelpNotify.TasksList) do
        if stage.name == stageName then found = true break end
    end
    if not found then
        return debugPrint("[^2HELPNOTIFICATION^7] Could not a find stage with name ^1" .. stageName .. "^7")
    end

    for _, stage in ipairs(HelpNotify.TasksList) do
        if stage.name == stageName then
            HelpNotify.UpdateStage({ stage = index, key = "complete", value = true })
            break
        end
    end
end

function HelpNotify.Remove()
    NUI.SendMessage("REMOVE_HELP_NOTIFY", {})
    HelpNotify.ExpiryTime = false
    HelpNotify.IsOnTickStarted = false
    HelpNotify.IsActive = false
    TriggerEvent("ltl_hud:Interfaces:HelpNotification:OnRemove")
end
