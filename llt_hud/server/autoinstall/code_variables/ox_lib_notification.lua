local settings = require 'resource.settings'

local iconsFromType = {
    ['info'] = 'fas fa-info',
    ['inform'] = 'fas fa-info',
    ['warning'] = 'fas fa-exclamation-triangle',
    ['success'] = 'fas fa-check',
    ['error'] = 'fas fa-times',
}

function lib.notify(data)
    local sound = settings.notification_audio and data.sound
    data.sound = nil

    exports['ltl_hud']:Notification(data.title or 'Notification', data.description or '', data.icon and data.icon or (data.type and iconsFromType[data.type] or false), data.duration)

    if not sound then return end

    if sound.bank then lib.requestAudioBank(sound.bank) end

    local soundId = GetSoundId()
    PlaySoundFrontend(soundId, sound.name, sound.set, true)
    ReleaseSoundId(soundId)

    if sound.bank then ReleaseNamedScriptAudioBank(sound.bank) end
end

function lib.defaultNotify(data)

    data.type = data.status
    if data.type == 'inform' then data.type = 'info' end
    return lib.notify(data)
end

RegisterNetEvent('ox_lib:notify', lib.notify)
RegisterNetEvent('ox_lib:defaultNotify', lib.defaultNotify)
