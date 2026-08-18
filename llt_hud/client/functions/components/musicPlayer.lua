MusicPlayer = {}
MusicPlayer.Ready = false

function MusicPlayer.HandleVolume(state)
    if not Config.UI.UseMusic then return end
    if not MusicPlayer.Ready then
        return debugPrint("[^2MUSIC^7] [^1ERROR^7] Music content is not ready!")
    end
    NUI.SendMessage("HANDLE_MUSIC", { state = state })
end

function MusicPlayer.SetAsReady()
    debugPrint("[^2MUSIC^7] Manually overriding for ready state.")
    NUI.SendMessage("OVERRIDE_MUSIC_STATE", {})
end

RegisterNUICallback("player.created", function()
    MusicPlayer.Ready = true
    MusicPlayer.SetAsReady()
end)
