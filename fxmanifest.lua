fx_version 'cerulean'
game 'gta5'
author '.zeusx#2743'
version '2.9'
description 'ltl_hud - User Interface for FiveM (ESX + pma-voice)'
lua54 'yes'

ui_page 'html/index.html'

files {
    'html/index.html',
    'html/css/*.css',
    'html/js/*.js',
    'html/js/**/*.js',
    'html/assets/*.mp3',
    'html/assets/*.ogg',
    'stream/map_timecycle_stream.xml',
    'sprites/interaction.html',
    'sprites/point.html',
    'sprites/ply_dui.html',
    'client/overrides/theme/style.css',
}

shared_scripts {
    '@ox_lib/init.lua',
    'shared/functions/*.lua',
    'shared/*.lua',
    'shared/translations/*.lua',
    'shared/ui_cfg/*.lua',
}

client_scripts {
    'client/config/*.lua',
    'client/functions/effects/*.lua',
    'client/commands/*.lua',
    'client/functions/data/*.lua',
    'client/functions/handlers/*.lua',
    'client/functions/handlers/duis/*.lua',
    'client/functions/components/*.lua',
    'client/overrides/natives/*.lua',
    'client/functions/threads/*.lua',
    'client/overrides/*.lua',
    'client/*.lua',
    'client/addon/*.lua',
}

server_scripts {
    'server/config/*.lua',
    'server/handlers/*.lua',
    'server/components/*.lua',
    'server/*.lua',
    'server/autoinstall/install_handler.lua',
}

data_file "TIMECYCLEMOD_FILE" "stream/map_timecycle_stream.xml"
dependency '/assetpacks'

dependencies {
    'es_extended',
    'pma-voice',
}
