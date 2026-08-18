Config = {}
Config.Debug = true
-- Mirrors the NUI trace into the F8 console. Turn it off to keep the debug
-- output Lua-only; the CEF console keeps everything either way.
Config.DebugNUIMirror = true
Config.DumpChangelog = false

Config.Server = {
    -- Resolved by the page itself, which lives in html/: a bare name is a file
    -- sitting next to index.html, so 'logo.png' means html/logo.png. Drop the
    -- image there and add nothing else — html/*.png is already shipped by the
    -- fxmanifest. A full https:// URL still works if you'd rather host it.
    ['Logo'] = 'logo.png',
    ['Name'] = 'My Server Name'
}

Config.DefaultMusic = 'https://www.youtube.com/watch?v=lh4JdZTJe7k&ab_channel=SoothingRelaxation'
Config.Currency = 'USD'
Config.Metrics = 'mph'
Config.UseSeatbelt = true
Config.PersistentMinimap = true
Config.PersistentStreetLabel = false
Config.AwaitShutdownLoadingScreen = false
Config.UseAutomaticOptimizationCheck = true
Config.UseTotalAmmoOnWeaponIndicator = true
Config.DisablePauseMenuInterval = 2
Config.DisableMinimapHandler = false
Config.DisableMinimapAnimation = false
Config.UseMusicInMulticharacter = true

Config.BringPlayerAfterWelcomeScreenToInitialCoords = false

Config.HideComponents = {
    [1] = true,
    [2] = true,
    [3] = true,
    [4] = true,
    [5] = true,
    [6] = true,
    [7] = true,
    [8] = true,
    [9] = true,
    [10] = true,
    [11] = true,
    [12] = true,
    [13] = true,
    [14] = false,
    [15] = true,
    [16] = true,
    [17] = true,
    [18] = true,
    [19] = true,
    [20] = true,
    [21] = true,
    [22] = true,
}

Config.RemoveFeedsAndDefaultNotifications = true
Config.HandleUIVisibilityOnBaseEvents = true

Config.KeyBinds = {
    -- ['menu'] = {
    --     description = 'UI Menu',
    --     key = 'F9',
    --     use = true,
    -- }, 
    -- ['cancel_progressbar'] = {
    --     description = 'Cancel Progressbar',
    --     key = 'X',
    --     use = true,
    -- }, 
    -- ['aio_menu'] = {
    --     description = 'AIO Menu',
    --     key = 'F1',
    --     use = true,
    -- }, 
    ['seatbelt'] = {
        description = 'Seatbelt',
        key = 'B',
        use = true,
    }, 
    -- ['cinematic_mode'] = {
    --     description = 'Open Cinematic Mode',
    --     key = 'F6',
    --     use = true,
    -- }, 
    -- ['cinematic_focus'] = {
    --     description = 'Click to focus on Cinematic Mode',
    --     key = 'LSHIFT',
    --     use = true,
    -- }
    -- No entry for the 3D perspective on purpose: pma-voice's proximity key owns
    -- it. Pressing that key changes the voice range and raises
    -- pma-voice:proximityChanged, which shows the indicator, so the FiveM
    -- settings list one key for both and rebinding it moves both.
}

Config.Commands = {
    ['menu'] = 'menu',
    ['cancel_progress'] = 'cancel_progressbar',
    ['aio_menu'] = 'aio_menu',
    ['seatbelt'] = 'seatbelt',
    ['cinematic_mode'] = 'cinematic_mode',
    ['cinematic_focus'] = 'cinematic_focus',
    -- Bound to no key (see Config.KeyBinds above): it stays a command so the
    -- display can still be raised by hand, through `bind keyboard <key>
    -- "+voice_state"` or another resource calling it. Renamed away from
    -- `hidden_content` so the TAB players already had saved for that name stops
    -- firing anything.
    ['3d_perspective'] = 'voice_state',
}

Config.UsePerspective = true

Config.UseOptimalValues = false

Config.WeaponBlacklist = {
    ['weapon_bat'] = true,
}

Config.BlacklistedVehicles = {

}

Config.CommandGroupAllowed = 'admin'
