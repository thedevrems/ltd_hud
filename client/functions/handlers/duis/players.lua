DUIS = {}
DUIS.TXD = CreateRuntimeTxd("ltl_ui_players_txd")

DUIS.Players = {
    List   = {},
    Amount = 0,
}

function DUIS.Players.Append(playerSource, playerPedId, url, callback)
    if DUIS.Players.List[tostring(playerSource)] then return end

    debugPrint("[^9DUI_HANDLER^7] Preparing DUI for PLY_SRC_" .. playerSource)

    local id     = _Lib.GenerateRandomString(10)
    local width  = math.floor(2560.0)
    local height = math.floor(1440.0)
    local duiUrl = "https://cfx-nui-" .. GetCurrentResourceName() .. "/sprites/" .. url
    local duiObj = CreateDui(duiUrl, width, height)
    local handle = GetDuiHandle(duiObj)

    while not IsDuiAvailable(duiObj) do Wait(100) end
    Wait(250)

    local entry = {
        playerSource   = playerSource,
        playerPedId    = playerPedId,
        url            = url,
        duiObject      = duiObj,
        id             = id,
        txn            = CreateRuntimeTextureFromDuiHandle(DUIS.TXD, id, handle),
        duiHandle      = handle,
        lastMessageTimer = false,
    }

    entry.addMessageME = function(content)
        debugPrint("[^9DUI_HANDLER^7] [^2DUI_" .. playerSource .. "^7] Sending [ME] message.")
        SendDuiMessage(duiObj, json.encode({
            type = "ADD_MESSAGE", messageType = "ME",
            messageColor = "#c94b5b", messageContent = content,
        }))
    end

    entry.addMessageDO = function(content)
        debugPrint("[^9DUI_HANDLER^7] [^2DUI_" .. playerSource .. "^7] Sending [DO] message.")
        SendDuiMessage(duiObj, json.encode({
            type = "ADD_MESSAGE", messageType = "DO",
            messageColor = "#c94b5b", messageContent = content,
        }))
    end

    entry.updateSelectedColor = function() end

    DUIS.Players.List[tostring(playerSource)] = entry
    DUIS.Players.Amount = DUIS.Players.Amount + 1

    debugPrint("[^9DUI_HANDLER^7] DUI PLY_SRC_" .. playerSource .. " has been loaded.")

    if callback then
        callback(DUIS.Players.List[tostring(playerSource)])
    end
end

function Create3DDUIHandle(playerSource, messageType, content)
    local key   = tostring(playerSource)
    local entry = DUIS.Players.List[key]

    if entry then
        local fn = (messageType == "ME") and entry.addMessageME or entry.addMessageDO
        fn(content)
        entry.endMessageTimer = GetGameTimer() + 13000
    else
        DUIS.Players.Append(
            playerSource,
            GetPlayerPed(GetPlayerFromServerId(playerSource)),
            "ply_dui.html",
            function(newEntry)
                local fn = (messageType == "ME") and newEntry.addMessageME or newEntry.addMessageDO
                fn(content)
                DUIS.Players.List[tostring(playerSource)].endMessageTimer = GetGameTimer() + 13000
            end)
    end
end

function DUIS.Players.GetDUI(playerSource)
    if not playerSource then
        return debugPrint("[^9DUI_HANDLER^7] Invalid param value for [playerSource]. Param output: " .. tostring(playerSource))
    end
    local entry = DUIS.Players.List[tostring(playerSource)]
    if not entry then
        return debugPrint("[^9DUI_HANDLER^7] No DUI has been found for: " .. playerSource)
    end
    return entry
end

function DUIS.Players.Remove(playerSource)
    local entry = DUIS.Players.List[tostring(playerSource)]
    if entry then
        DestroyDui(entry.duiObject)
        Wait(100)
        DUIS.Players.Amount = DUIS.Players.Amount - 1
        DUIS.Players.List[tostring(playerSource)] = nil
        debugPrint("[^9DUI_HANDLER^7] Removed DUI for PLY_SRC_" .. playerSource)
    end
end

RegisterNetEvent("ltl_hud:PlayerDUIS:Add")
AddEventHandler("ltl_hud:PlayerDUIS:Add", function(playerSource, messageType, content)
    Create3DDUIHandle(playerSource, messageType, content)
end)

RegisterNetEvent("ltl_hud:PlayerDUIS:Remove")
AddEventHandler("ltl_hud:PlayerDUIS:Remove", function(playerSource)
    DUIS.Players.Remove(playerSource)
end)
