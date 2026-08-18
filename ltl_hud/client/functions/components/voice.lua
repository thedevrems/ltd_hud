-- This resource registers no voice keybind. Pressing pma-voice's cycle key (F11
-- by default) changes the range, and pma-voice tells us so; the indicator then
-- shows the new range for Config.Voice.FlashDuration. Rebinding that one key in
-- the FiveM settings is all there is to rebind.
--
-- Two sources can raise the indicator, the flash above and Voice.Hold, and they
-- share one visibility state so neither can hide what the other is showing.

Voice = {}
Voice.Held = false
Voice.Shown = false
Voice.FlashUntil = 0
Voice.FlashRunning = false

function Voice.Init(enable, screenName)
    if Config.UI.DisableVoiceIndicator then return end

    if not Config.UI.Use3DVoiceIndicator then
        if not enable and screenName then
            if TopContent.CurrentScreen ~= screenName then return end
        end
        NUI.SendMessage("SET_TOP_CONTENT_VISIBILITY", { state = enable })
    else
        NUI.SendMessage("SET_VOICE_INDICATOR_AS_VISIBLE", { state = enable })
    end
end

function Voice.SetData(data)
    NUI.SendMessage("SET_VOICE_INDICATOR_DATA", data)
end

-- pma-voice owns the mode: reading its statebag instead of caching a copy here
-- is what keeps the label right after either resource restarts.
function Voice.CurrentMode()
    local proximity = LocalPlayer.state.proximity
    if type(proximity) == "table" and proximity.mode then
        return proximity.mode
    end
    return Config.Voice.DefaultMode
end

-- Pushed again before every reveal. The statebag change carrying the mode may
-- have landed while the page was still loading, and a SendNUIMessage sent then
-- is lost for good, which is why the indicator used to read Normal forever.
function Voice.Refresh(mode)
    mode = mode or Voice.CurrentMode()
    Voice.SetData({
        value = Config.Voice.NameToProgress[mode] or Config.Voice.DefaultProgress,
        label = Config.Voice.Labels[mode] or mode,
    })
    return mode
end

-- The 3D block the indicator sits in used to have its own hold key. It follows
-- the hold and not the flash: a tap only has to update the indicator, while a
-- deliberate hold is what asks for the whole display.
local perspectiveShown = false

local function applyPerspective(state)
    if not Config.Voice.RevealPerspectiveOnHold then return end
    if not Config.UsePerspective or Config.UI.StaticPerspective then return end
    if state == perspectiveShown then return end
    perspectiveShown = state
    Perspective.ShowHiddenContent(state)
end

function Voice.Apply()
    applyPerspective(Voice.Held)

    local shouldShow = Voice.Held or GetGameTimer() < Voice.FlashUntil
    if shouldShow == Voice.Shown then return end
    Voice.Shown = shouldShow

    if shouldShow and not Config.UI.Use3DVoiceIndicator then
        TopContent.SetScreen("proximity")
    end
    Voice.Init(shouldShow, "proximity")
end

-- Key down / key up. The mode is re-sent on the way in so a hold always reads
-- the live range even if nothing changed since the last reveal.
function Voice.Hold(state)
    Voice.Held = state
    if state then Voice.Refresh() end
    Voice.Apply()
end

function Voice.Flash(duration)
    Voice.FlashUntil = GetGameTimer() + (duration or Config.Voice.FlashDuration)
    Voice.Apply()
    if Voice.FlashRunning then return end

    Voice.FlashRunning = true
    CreateThread(function()
        -- Re-read the deadline each pass: cycling again mid-flash extends it
        -- instead of stacking a second thread on top.
        while GetGameTimer() < Voice.FlashUntil do
            Wait(Voice.FlashUntil - GetGameTimer())
        end
        Voice.FlashRunning = false
        Voice.Apply()
    end)
end

-- A server that turned the indicator off keeps pma-voice's key cycling silently,
-- hence the guard here rather than inside Voice.Apply: Voice.Hold must still be
-- able to raise the 3D block, which is a separate component.
local function onProximityChanged(mode)
    if Config.UI.DisableVoiceIndicator then return end
    Voice.Refresh(mode)
    Voice.Flash()
end

-- The one that matters: pma-voice raises it from setProximityState with the
-- range name already resolved, on the same frame as the key press. Nothing has
-- to be read back, so a range set before this handler existed cannot leave a
-- stale label behind.
AddEventHandler("pma-voice:proximityChanged", function(proximity)
    if type(proximity) ~= "table" or not proximity.mode then return end
    onProximityChanged(proximity.mode)
end)

-- Kept as a second path for anything that writes the bag without going through
-- pma-voice. Both land on the same idempotent refresh, so a doubled change just
-- re-sends the same label and extends the same flash.
AddStateBagChangeHandler("proximity", nil, function(bag, _, value)
    if bag ~= ("player:%s"):format(GetPlayerServerId(PlayerId())) then return end
    if type(value) ~= "table" or not value.mode then return end

    onProximityChanged(value.mode)
end)

-- First paint. Without it the page keeps its own defaults (Normal, 50%) until
-- the player happens to change range, which is the state ltl_hud starts in on
-- every restart since pma-voice sets the mode once, at connect.
CreateThread(function()
    while not NUI.Loaded or not Storage.HasBeenSent do Wait(500) end
    Voice.Refresh()
end)

TopContent = {}
TopContent.CurrentScreen = ""

function TopContent.SetScreen(screenName)
    if TopContent.CurrentScreen == screenName then return end
    TopContent.CurrentScreen = screenName
    NUI.SendMessage("SET_TOP_CONTENT_SCREEN", { name = screenName })
end

function TopContent.Init(state)
    NUI.SendMessage("SET_TOP_CONTENT_VISIBILITY", { state = state })
end
