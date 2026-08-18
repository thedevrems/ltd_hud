DefaultNotifies = {}

function DefaultNotifies.Add(notifyData)
    notifyData.serial = _Lib.GenerateRandomString(10)
    NUI.SendMessage("ADD_DEFAULT_NOTIFIES", notifyData)
    TriggerEvent("ltl_hud:Interfaces:DefaultNotifications:OnAdd", notifyData.serial)
    return notifyData.serial
end

function DefaultNotifies.Remove(serial)
    if not serial then
        return debugPrint("[^2DEFAULT NOTIFICATION^7] You need to fulfill serial in order to remove notification!")
    end
    NUI.SendMessage("REMOVE_DEFAULT_NOTIFY", { serial = serial })
    TriggerEvent("ltl_hud:Interfaces:DefaultNotifications:OnRemove", serial)
end

function DefaultNotifies.Update(serial, newText)
    if not serial then
        return debugPrint("[^2DEFAULT NOTIFICATION^7] You need to fulfill serial in order to update notification!")
    end
    NUI.SendMessage("UPDATE_DEFAULT_NOTIFY", { serial = serial, text = newText })
end

function DefaultNotifies.UpdateProgress(serial, newValue)
    if not serial then
        return debugPrint("[^2DEFAULT NOTIFICATION^7] You need to fulfill serial in order to update notification!")
    end
    NUI.SendMessage("UPDATE_DEFAULT_NOTIFY_PROGRESS", { serial = serial, value = newValue })
end
