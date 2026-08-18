ProgressBar = {}
ProgressBar.IsActive   = false
ProgressBar.CanCancel  = false
ProgressBar.LeftState  = -1
ProgressBar.PlayerProps = {}

ProgressBar.TypeToControls = {
    disable_mouse   = { 1, 2, 106 },
    disable_walk    = { 30, 31, 36, 21, 75 },
    disable_driving = { 63, 64, 71, 72 },
    disable_combat  = { 24, 25, 37, 47, 58, 140, 141, 142, 143, 263, 264, 257 },
}

local function SpawnProp(ped, propData)
    if not propData.model then
        debugPrint("[^1ERROR^7] Could not find a model.")
        return false
    end

    local modelHash = propData.model
    if type(modelHash) ~= "number" then
        modelHash = joaat(modelHash)
    end

    RequestModel(modelHash)
    local startTime = GetGameTimer()
    local deadline  = startTime + 3000
    local now       = startTime

    while not HasModelLoaded(modelHash) and deadline > now do
        now = GetGameTimer()
        Wait(50)
    end

    if not HasModelLoaded(modelHash) then
        debugPrint("[^1ERROR^7] Could not load model.")
        return false
    end

    local coords = GetEntityCoords(ped)
    local obj = CreateObject(propData.model, coords.x, coords.y, coords.z, true, true, false)

    if propData.coords   then propData.pos = propData.coords   end
    if propData.rotation then propData.rot = propData.rotation end

    propData.pos = propData.pos or {}
    propData.rot = propData.rot or {}

    local bone = GetPedBoneIndex(ped, propData.bone or 60309)
    AttachEntityToEntity(
        obj, ped, bone,
        propData.pos.x or 0.0, propData.pos.y or 0.0, propData.pos.z or 0.0,
        propData.rot.x or 0.0, propData.rot.y or 0.0, propData.rot.z or 0.0,
        true, true, false, true,
        propData.rotOrder or 0,
        true)
    SetModelAsNoLongerNeeded(propData.model)
    return obj
end

function ProgressBar.Thread(controlOptions)
    for controlType, enabled in pairs(controlOptions) do
        if enabled then
            local controls = ProgressBar.TypeToControls[controlType]
            if controls then
                for _, control in ipairs(controls) do
                    DisableControlAction(0, control, true)
                end
            end
        end
    end
    if controlOptions.disableCombat then
        DisablePlayerFiring(PlayerId(), true)
    end
end

function ProgressBar.Create(icon, text, duration, onComplete, onCancel, canCancel, controlOptions, animData, prop1, prop2, isAsync)
    if not Config.ProgressBar.Use then return end
    if ProgressBar.IsActive then
        return debugPrint("[^1ERROR^7] Progressbar is currently active. Returning.")
    end

    duration = duration or 5000

    local function runSync()
        NUI.SendMessage("PROGRESS_BAR_INIT", { text = text, icon = icon, duration = duration })
        ProgressBar.CanCancel = (canCancel == true)
        ProgressBar.LeftState = -1
        ProgressBar.IsActive  = true

        if prop1 then
            if type(prop1) ~= "table" or not prop1.model then
                debugPrint("[^2PROGRESSBAR^7] [^1ERROR^7] Could not add prop for argument [prop]. Parameter is not an object!")
            else
                local entity = SpawnProp(PlayerPedId(), prop1)
                table.insert(ProgressBar.PlayerProps, entity)
            end
        end

        if prop2 then
            if type(prop2) ~= "table" or not prop2.model then
                debugPrint("[^2PROGRESSBAR^7] [^1ERROR^7] Could not add prop for argument [prop2]. Parameter is not an object!")
            else
                local entity = SpawnProp(PlayerPedId(), prop2)
                table.insert(ProgressBar.PlayerProps, entity)
            end
        end

        if animData then

            if animData.task      then animData.scenario = animData.task      end
            if animData.animDict  then animData.dict     = animData.animDict  end
            if animData.anim      then animData.clip     = animData.anim      end
            if animData.flags     then animData.flag     = animData.flags     end

            if animData.dict then
                if type(animData.dict) == "string" and DoesAnimDictExist(animData.dict) then
                    if not HasAnimDictLoaded(animData.dict) then
                        RequestAnimDict(animData.dict)
                        while not HasAnimDictLoaded(animData.dict) do Wait(10) end
                    end
                    TaskPlayAnim(
                        PlayerPedId(),
                        animData.dict, animData.clip,
                        animData.blendIn  or 3.0,
                        animData.blendOut or 1.0,
                        animData.duration or -1,
                        animData.flag     or 49,
                        animData.playbackRate or 0,
                        animData.lockX, animData.lockY, animData.lockZ)
                    RemoveAnimDict(animData.dict)
                end
            elseif animData.scenario then
                local playEnter = (animData.playEnter ~= nil) and animData.playEnter or true
                TaskStartScenarioInPlace(PlayerPedId(), animData.scenario, 0, playEnter)
            end
        end

        while ProgressBar.IsActive do
            if controlOptions and type(controlOptions) == "table" then
                ProgressBar.Thread(controlOptions)
            end
            Wait(0)
        end

        if (prop1 or prop2) and #ProgressBar.PlayerProps > 0 then
            for _, propEntity in ipairs(ProgressBar.PlayerProps) do
                if DoesEntityExist(propEntity) then
                    DeleteEntity(propEntity)
                end
            end
        end

        if animData then
            if animData.dict then
                StopAnimTask(PlayerPedId(), animData.dict, animData.clip, 1.0)
                Wait(0)
            else
                ClearPedTasks(PlayerPedId())
            end
        end

        TriggerEvent("ltl_hud:ProgressComplete")
        NUI.SendMessage("PROGRESS_BAR_REMOVE", {})

        if onComplete and ProgressBar.LeftState == "DONE"     then onComplete() end
        if onCancel   and ProgressBar.LeftState == "CANCELED" then onCancel()   end

        return ProgressBar.LeftState == "DONE"
    end

    if not isAsync then
        return runSync()
    else

        Wait(50)
        CreateThread(function()
            NUI.SendMessage("PROGRESS_BAR_INIT", { text = text, icon = icon, duration = duration })
            ProgressBar.CanCancel = (canCancel == true)
            ProgressBar.LeftState = -1
            ProgressBar.IsActive  = true

            while ProgressBar.IsActive do Wait(10) end

            NUI.SendMessage("PROGRESS_BAR_REMOVE", {})
            if ProgressBar.LeftState == "DONE" then
                TriggerEvent("ltl_hud:ProgressComplete")
            end
        end)
    end
end

function ProgressBar.IsCurrentlyActive()
    return ProgressBar.IsActive
end

function ProgressBar.Cancel()
    if not ProgressBar.IsActive then
        return debugPrint("[^1ERROR^7] Non-active progressbar. Returning cancel event.")
    end
    if not ProgressBar.CanCancel then
        return debugPrint("[^1ERROR^7] Can not cancel progressbar.")
    end
    ProgressBar.LeftState = "CANCELED"
    ProgressBar.IsActive  = false
end

function ProgressBar.Finish()
    if not ProgressBar.IsActive then
        return debugPrint("[^1ERROR^7] Non-active progressbar. Returning complete event.")
    end
    ProgressBar.LeftState = "DONE"
    ProgressBar.IsActive  = false
end

RegisterNUICallback("progress.onFinish", ProgressBar.Finish)

RegisterCommand(Config.Commands.cancel_progress, function()
    ProgressBar.Cancel()
end)
