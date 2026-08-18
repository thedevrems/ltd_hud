-- Commenting an entry out of Config.KeyBinds is the documented way to drop a key
-- for good, so a missing table has to read the same as `use = false` here rather
-- than error on a nil index while the resource is still starting.
local function bind(keybind, command)
    local entry = Config.KeyBinds[keybind]
    if not entry or not entry.use then return end
    RegisterKeyMapping(Config.Commands[command], entry.description, 'KEYBOARD', entry.key)
end

bind('menu', 'menu')
bind('cancel_progressbar', 'cancel_progress')
bind('aio_menu', 'aio_menu')
bind('cinematic_mode', 'cinematic_mode')
bind('cinematic_focus', 'cinematic_focus')

-- Nothing for '3d_perspective': pressing pma-voice's proximity key is what shows
-- the voice indicator, through pma-voice:proximityChanged, so registering one
-- here would put a second rebindable key in the FiveM settings for the same job.
