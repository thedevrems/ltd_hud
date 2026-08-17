if Config.KeyBinds['menu'].use then RegisterKeyMapping(Config.Commands['menu'], Config.KeyBinds['menu'].description, 'KEYBOARD', Config.KeyBinds['menu'].key) end
if Config.KeyBinds['cancel_progressbar'].use then RegisterKeyMapping(Config.Commands['cancel_progress'], Config.KeyBinds['cancel_progressbar'].description, 'KEYBOARD', Config.KeyBinds['cancel_progressbar'].key) end
if Config.KeyBinds['aio_menu'].use then RegisterKeyMapping(Config.Commands['aio_menu'], Config.KeyBinds['aio_menu'].description, 'KEYBOARD', Config.KeyBinds['aio_menu'].key) end
if Config.KeyBinds['cinematic_mode'].use then RegisterKeyMapping(Config.Commands['cinematic_mode'], Config.KeyBinds['cinematic_mode'].description, 'KEYBOARD', Config.KeyBinds['cinematic_mode'].key) end
if Config.KeyBinds['cinematic_focus'].use then RegisterKeyMapping(Config.Commands['cinematic_focus'], Config.KeyBinds['cinematic_focus'].description, 'KEYBOARD', Config.KeyBinds['cinematic_focus'].key) end
if Config.KeyBinds['3d_perspective'].use then RegisterKeyMapping('+'..Config.Commands['3d_perspective'], Config.KeyBinds['3d_perspective'].description, 'KEYBOARD', Config.KeyBinds['3d_perspective'].key) end
