-- Bridge between the NUI trace and the F8 console.
--
-- The NUI half of this resource logs into the CEF console, which nobody reads
-- while playing. Everything the page considers important is mirrored here
-- through "debug.log", so a single F8 console shows the Lua chain and the NUI
-- chain interleaved in real time.

Debug.NUI = {}
Debug.NUI.LineCount = 0

local LEVEL_TAGS = {
    log   = "^5NUI^7",
    warn  = "^3NUI^7",
    error = "^1NUI^7",
}

RegisterNUICallback("debug.log", function(data, cb)
    if not Config.Debug then
        if cb then cb("ok") end
        return
    end

    local level = data.level or "log"
    local tag   = LEVEL_TAGS[level] or LEVEL_TAGS.log
    local line  = ("[%s][^3%s^7] %s"):format(tag, data.scope or "?", data.message or "")

    if data.data ~= nil and data.data ~= "" then
        line = line .. " ^8" .. tostring(data.data) .. "^7"
    end

    Debug.NUI.LineCount = Debug.NUI.LineCount + 1
    print("^5[INTERFACE]^7 " .. line)

    if cb then cb("ok") end
end)

-- One-shot picture of every flag the welcome flow depends on. Read top to
-- bottom: the first false is where the chain stops.
local function printState()
    local screenW, screenH = GetActiveScreenResolution()

    print("^5" .. string.rep("=", 68) .. "^7")
    print("^5[INTERFACE]^7 ^2HUD DEBUG REPORT^7 (client side)")
    print("^5" .. string.rep("=", 68) .. "^7")

    Debug.Print("STATE", "NUI.Loaded ................ %s", Debug.Bool(NUI.Loaded))
    Debug.Print("STATE", "Storage.HasBeenSent ....... %s", Debug.Bool(Storage.HasBeenSent))
    Debug.Print("STATE", "Storage.Data.createdUI .... %s", Debug.Bool(Storage.Data and Storage.Data.createdUI))
    Debug.Print("STATE", "Storage.Data.UIConfigured . %s", Debug.Bool(Storage.Data and Storage.Data.UIConfigured))
    Debug.Print("STATE", "Storage.CurrentScreen ..... ^3%s^7", tostring(Storage.CurrentScreen))
    Debug.Print("STATE", "NUI.IsInterfaceDisabled ... %s", Debug.Bool(NUI.IsInterfaceDisabled))
    Debug.Print("STATE", "IsNuiFocused .............. %s", Debug.Bool(IsNuiFocused()))

    print("")
    Debug.Print("VISIBILITY", "UI_DataLoaded ............. %s", Debug.Bool(LocalPlayer.state.UI_DataLoaded))
    Debug.Print("VISIBILITY", "UI_UserData present ....... %s", Debug.Bool(LocalPlayer.state.UI_UserData ~= nil))
    Debug.Print("VISIBILITY", "UIV2_Preloaded ............ %s", Debug.Bool(LocalPlayer.state.UIV2_Preloaded))
    Debug.Print("VISIBILITY", "HandleUIVisibilityOnBaseEvents %s", Debug.Bool(Config.HandleUIVisibilityOnBaseEvents))
    if not LocalPlayer.state.UI_DataLoaded then
        Debug.Print("VISIBILITY", "^1=> ltl_hud:Client:LoadPlayer has not fired: SET_UI_VISIBLE was never sent,^7")
        Debug.Print("VISIBILITY", "^1   so every hud layer stays at opacity 0. Check ltl:playerLoaded server side.^7")
    end

    print("")
    Debug.Print("CONFIG", "FrameworkSelected ......... %s", Debug.Bool(FrameworkSelected))
    Debug.Print("CONFIG", "UI.UseWelcomeScreen ....... %s", Debug.Bool(Config.UI.UseWelcomeScreen))
    Debug.Print("CONFIG", "UI.UseConfiguration ....... %s", Debug.Bool(Config.UI.UseConfiguration))
    Debug.Print("CONFIG", "UI.UseMusic ............... %s", Debug.Bool(Config.UI.UseMusic))
    Debug.Print("CONFIG", "Hud.Use ................... %s", Debug.Bool(Config.Hud.Use))
    Debug.Print("CONFIG", "PersistentMinimap ......... %s", Debug.Bool(Config.PersistentMinimap))
    Debug.Print("CONFIG", "AutoStartMainMenu ......... %s", Debug.Bool(Config.AutoStartMainMenu))
    Debug.Print("CONFIG", "Resolution ................ %dx%d", screenW, screenH)

    print("")
    Debug.Print("THREADS", "Threads.Hud.Use ........... %s", Debug.Bool(Threads.Hud and Threads.Hud.Use))
    Debug.Print("THREADS", "Radar hidden .............. %s", Debug.Bool(IsRadarHidden()))
    Debug.Print("THREADS", "NUI lines mirrored ........ ^3%d^7", Debug.NUI.LineCount)

    print("^5" .. string.rep("-", 68) .. "^7")
    Debug.Print("STATE", "Asking the NUI for its own dump [/]")
end

RegisterCommand("hud_debug", function()
    printState()
    NUI.SendMessage("DEBUG_DUMP_STATE", { reason = "hud_debug" })
end, false)

-- Forces the visibility handshake by hand. If the hud appears after running
-- this, the NUI is fine and the problem is that SET_UI_VISIBLE never arrived.
RegisterCommand("hud_force_visible", function()
    Debug.Print("STATE", "^3Forcing the visibility handshake manually.^7")
    NUI.SetDataLoadedStatus(true)
    NUI.SetUIVisible(true)
end, false)

-- Deferred: client/overrides/chat.lua registers the handler after this file loads.
Citizen.CreateThread(function()
    Wait(2000)
    TriggerEvent("chat:addSuggestion", "/hud_debug", "Prints the full ltl_hud state (client + NUI)")
    TriggerEvent("chat:addSuggestion", "/hud_force_visible", "Forces SET_UI_VISIBLE to test the hud visibility chain")
end)

-- Watchdog for the one failure that produces no error anywhere: the welcome flow
-- completes, the game screen is routed, and the hud layers stay at opacity 0
-- because ltl_hud:Client:LoadPlayer never ran. That happens whenever ltl_hud is
-- restarted while the player is already spawned, since ltl:playerLoaded only
-- fires once per login.
local WATCHDOG_GRACE = 8000

Citizen.CreateThread(function()
    while not Storage.Data or not Storage.Data.createdUI do Wait(500) end
    Wait(WATCHDOG_GRACE)

    if LocalPlayer.state.UI_DataLoaded then return end

    print("^3" .. string.rep("=", 68) .. "^7")
    Debug.Print("WATCHDOG", "^3The UI is created but no hud element can be visible.^7")
    Debug.Print("WATCHDOG", "ltl_hud:Client:LoadPlayer never fired, so SET_UI_VISIBLE was never sent")
    Debug.Print("WATCHDOG", "and every hud layer is stuck at opacity 0 behind .ui-screen.visible")
    Debug.Print("WATCHDOG", "")
    Debug.Print("WATCHDOG", "Usual causes:")
    Debug.Print("WATCHDOG", "  1. ltl_hud was restarted while already spawned (ltl:playerLoaded fires once per login)")
    Debug.Print("WATCHDOG", "  2. ltl_core never emitted ltl:playerLoaded for this session")
    Debug.Print("WATCHDOG", "  3. Config.HandleUIVisibilityOnBaseEvents is false (currently %s)",
        Debug.Bool(Config.HandleUIVisibilityOnBaseEvents))
    Debug.Print("WATCHDOG", "")
    Debug.Print("WATCHDOG", "Run ^2/hud_force_visible^7 — if the hud appears, it is this and not the presets screen.")
    print("^3" .. string.rep("=", 68) .. "^7")
end)
