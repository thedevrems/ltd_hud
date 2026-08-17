TextUI = {}
TextUI.List       = {}
TextUI.Amount     = 0
TextUI.TextBuffer = {}

local function buildEntry(serial, key, text, duration, onComplete, onFailure, isForPersistent)
    local resolvedDuration = duration
    if not (duration and (isForPersistent or onComplete)) then
        resolvedDuration = -1
    end

    NUI.SendMessage("ADD_TEXT_UI_ELEMENT", {
        serial   = serial,
        key      = key,
        text     = text,
        duration = resolvedDuration,
    })

    TextUI.List[serial] = {
        serial     = serial,
        key        = key,
        text       = text,
        duration   = duration or "permament",
        onComplete = onComplete or "NO_CALLBACK_FOR_ONCOMPLETE",
        onFailure  = onFailure  or "NO_CALLBACK_FOR_ONFAILURE",
    }
    TextUI.TextBuffer[text] = serial

    if duration or duration == -1 then
        if not onComplete then
            return debugPrint("[^2TEXTUI^7] No onComplete callback was created. Switching to non-controllable TextUI.")
        end
        if not onFailure and duration ~= -1 then
            debugPrint("[^2TEXTUI^7] No onFailure callback was created. You will not get the access to that feature.")
        end

        Citizen.CreateThread(function()
            local pressed = false
            while TextUI.List[serial] do

                local currentKey = TextUI.List[serial] and TextUI.List[serial].key or key
                local keyCode = Keys[currentKey:upper()]
                if keyCode and IsControlJustPressed(0, keyCode) then
                    pressed = true
                    break
                end
                Wait(0)
            end

            if pressed then
                if onComplete then onComplete() end
                TextUI.Remove(serial, true)
            else
                if onFailure then onFailure() end
                TextUI.Remove(serial, false)
            end
        end)
    end

    return serial
end

function TextUI.CreatePersistent(key, text, duration, onComplete, onFailure)
    if TextUI.List["textui_persistent"] then return end
    buildEntry("textui_persistent", key, text, duration, onComplete, onFailure, true)
end

function TextUI.DoesExist(serial)
    return TextUI.List[serial] ~= nil
end

function TextUI.GetData(serial)
    local entry = TextUI.List[serial]
    if entry then
        return true, entry
    end
    return false, {}
end

function TextUI.RemovePersistent(anim)
    if not TextUI.List["textui_persistent"] then return end
    NUI.SendMessage("REMOVE_TEXT_UI_ELEMENT", { serial = "textui_persistent", anim = anim })
    TextUI.List["textui_persistent"] = nil
end

function TextUI.Add(key, text, duration, onComplete, onFailure)
    local upperKey = key:upper()
    if not Keys[upperKey] then
        return debugPrint("[^2TEXTUI^7] Key: [" .. upperKey .. "] does not exists. Returning.")
    end

    if TextUI.TextBuffer[text] then return end

    local serial = "textui_" .. _Lib.GenerateRandomString(10)
    return buildEntry(serial, key, text, duration, onComplete, onFailure, false)
end

function TextUI.UpdateText(serial, newText)
    if not TextUI.List[serial] then return end
    NUI.SendMessage("UPDATE_TEXT_UI_ELEMENT", { serial = serial, key = "text", value = newText })
end

function TextUI.UpdatePersistentText(newText)
    TextUI.UpdateText("textui_persistent", newText)
end

function TextUI.UpdateKey(serial, newKey)
    if not TextUI.List[serial] then return end
    TextUI.List[serial].key = newKey
    NUI.SendMessage("UPDATE_TEXT_UI_ELEMENT", { serial = serial, key = "key", value = newKey })
end

function TextUI.UpdatePersistentKey(newKey)
    TextUI.UpdateKey("textui_persistent", newKey)
end

RegisterNUICallback("textui.forceRemoveOnFailure", function(data)
    TextUI.Remove(data.serial, false)
end)

function TextUI.Remove(serial, anim)
    if not TextUI.List[serial] then return end
    NUI.SendMessage("REMOVE_TEXT_UI_ELEMENT", { serial = serial, anim = anim })
    TextUI.TextBuffer[TextUI.List[serial].text] = nil
    TextUI.List[serial] = nil
end
