Config.Voice = {}

-- pma-voice names its ranges in its own shared.lua and hands the name over on
-- pma-voice:proximityChanged. Keep these keys in step with its Cfg.voiceModes;
-- a name missing from this table (a range forced through overrideProximityRange
-- reports "Custom") falls back on DefaultProgress rather than freezing the
-- gauge, and is drawn as-is rather than as a blank label.
Config.Voice.NameToProgress = {
    ['Shouting'] = 100,
    ['Normal'] = 50,
    ['Whisper'] = 25,
}

-- Text drawn in the indicator. Translate here and not in pma-voice: its names
-- are also what gets replicated to the other clients.
Config.Voice.Labels = {
    ['Shouting'] = 'Crié',
    ['Normal'] = 'Normal',
    ['Whisper'] = 'Chuchoté',
    ['Custom'] = 'Personnalisé',
}

-- Used before pma-voice ever pushed a mode, so the indicator never shows a
-- range the player is not actually talking at.
Config.Voice.DefaultMode = 'Normal'
Config.Voice.DefaultProgress = 50

-- How long the indicator stays up each time the range changes. Pressing the key
-- again mid-flash extends it rather than starting a second one.
Config.Voice.FlashDuration = 3000

-- Whether an open mic RAISES the indicator. False: talking is drawn but never
-- announced -- the mic pip lights up on a block already on screen, and nothing
-- more. True restores the old reflex, where every push-to-talk threw the block
-- in front of the player, which is a lot of screen for a fact they already know
-- (they are the one holding the key).
--
-- Either way the range still shows itself on a range change and on a hold of
-- '+voice_state'; this setting only speaks for the mic.
Config.Voice.RevealWhileTalking = false

-- Bring the rest of the 3D block (the hud column and its statuses) up with the
-- indicator, but only for a hold on the '+voice_state' command. A range change
-- never does it, so cycling ranges shows the indicator alone instead of throwing
-- the whole display in the player's face. Ignored when
-- Config.UI.StaticPerspective already keeps that block permanently visible.
Config.Voice.RevealPerspectiveOnHold = true
