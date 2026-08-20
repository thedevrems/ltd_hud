-- This resource registers no voice keybind. Pressing pma-voice's cycle key (F11
-- by default) changes the range, and pma-voice tells us so; the indicator then
-- shows the new range for Config.Voice.FlashDuration. Rebinding that one key in
-- the FiveM settings is all there is to rebind.
--
-- Three sources can raise the indicator -- the flash above, Voice.Hold, and an
-- open mic when Config.Voice.RevealWhileTalking allows it -- and they share one
-- visibility state so neither can hide what another is showing. That state lives
-- HERE and nowhere else: the page used to reveal the block on its own whenever
-- the mic opened, which put a second hand on a switch this file believed it was
-- the only one holding.

Voice = {}
Voice.Held = false
Voice.Talking = false
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

-- Which screen the 2D band was last asked to show, remembered so the hide can
-- name it: Voice.Init refuses to hide a band that has since been handed to
-- someone else, and that check only works if it is given the screen this file
-- actually raised rather than a hardcoded guess.
local lastScreen = "proximity"

function Voice.Apply()
    applyPerspective(Voice.Held)

    local talkingReveal = Voice.Talking and Config.Voice.RevealWhileTalking
    local shouldShow = Voice.Held or talkingReveal or GetGameTimer() < Voice.FlashUntil

    -- Chosen before the guard below: a mic opening during a flash changes the
    -- screen without changing the visibility, and returning early would leave
    -- the band showing the wrong one.
    if shouldShow and not Config.UI.Use3DVoiceIndicator then
        -- The dancing bars belong to the mic, the gauge to the range. A hold
        -- asked for the range, so it wins over an open mic.
        lastScreen = (talkingReveal and not Voice.Held) and "voice" or "proximity"
        TopContent.SetScreen(lastScreen)
    end

    if shouldShow == Voice.Shown then return end
    Voice.Shown = shouldShow

    Voice.Init(shouldShow, lastScreen)
end

-- Key down / key up. The mode is re-sent on the way in so a hold always reads
-- the live range even if nothing changed since the last reveal.
function Voice.Hold(state)
    Voice.Held = state
    if state then Voice.Refresh() end
    Voice.Apply()
end

-- The mic opened or closed. TWO DIFFERENT THINGS hang off this, and keeping them
-- apart is the whole point: the page is always told, because that is what lights
-- the mic pip on a block already on screen, while RAISING the block on an open
-- mic is a taste that Config.Voice.RevealWhileTalking owns. Off, talking is
-- something the indicator reports and never something that summons it.
function Voice.SetTalking(state)
    if state == Voice.Talking then return end
    Voice.Talking = state

    if Config.UI.Use3DVoiceIndicator then
        NUI.SendMessage("SET_VOICE_INDICATOR_PLAYER_TALKING", { state = state })
    end

    Voice.Apply()
end

-- Mumble has no "started/stopped talking" event to subscribe to, so this is a
-- poll. A third of a second is under what a listener notices and cheap enough to
-- leave running: the native reads a local flag, and the thread only touches the
-- page on a change.
if Config.UI.UseListenerForMumble and not Config.UI.DisableVoiceIndicator then
    CreateThread(function()
        while true do
            Voice.SetTalking(MumbleIsPlayerTalking(Threads.Players.Data.player) == 1)
            Wait(300)
        end
    end)
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
