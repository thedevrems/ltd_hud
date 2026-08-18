Perspective = {}
Perspective.UseThread = false

function Perspective.Thread(enable)
    if not Config.UsePerspective then return end
    Perspective.UseThread = enable
    local interval = Config.Intervals.perspective.active

    CreateThread(function()
        local lastX = nil
        local lastZ = nil

        while Perspective.UseThread do
            local camRot = GetGameplayCamRot(0)
            local camX   = camRot.x
            local camZ   = camRot.z

            local xChanged = lastX and math.abs(camX - lastX) > 0.05
            local zChanged = lastZ and math.abs(camZ - lastZ) > 0.05

            if not lastX or xChanged or zChanged then

                SendNUIMessage({
                    type = "UPDATE_ROTATIONS",
                    data = {
                        offsets = {
                            x = camX,
                            y = ((0.0 - camZ) - 75.0) * 0.2,
                            z = 0.01,
                        }
                    }
                })
                lastX = camX
                lastZ = camZ
                Wait(interval)
            else

                Wait(interval + 100)
            end
        end
    end)
end

function Perspective.SetStatusVisibility(key, state)
    NUI.SendMessage("SET_STATUS_VISIBILITY", { key = key, state = state })
end

function Perspective.SetStatusValue(key, value)
    NUI.SendMessage("SET_STATUS_VALUE", { key = key, value = value })
end

function Perspective.ShowHiddenContent(state)
    NUI.SendMessage("SET_PERSPECTIVE_CONTENT_VISIBILITY", { state = state })
end

if Config.UI.StaticPerspective then
    while not NUI.Loaded or not Storage.HasBeenSent do Wait(100) end
    Perspective.ShowHiddenContent(true)
end

function Perspective.UpdateRotations(offsets)
    NUI.SendMessage("UPDATE_ROTATIONS", { offsets = offsets })
end

-- Registered but bound to no key: holding pma-voice's proximity key is what
-- raises the display, so the hud adds none of its own. These stay as commands
-- for a manual `bind keyboard <key> "+voice_state"`. Voice.Hold drives the whole
-- 3D block, indicator and perspective content alike, so nothing here has to
-- branch on Use3DVoiceIndicator.
RegisterCommand("+" .. Config.Commands["3d_perspective"], function()
    if Config.UI.StaticPerspective then return end
    Voice.Hold(true)
end, false)

RegisterCommand("-" .. Config.Commands["3d_perspective"], function()
    if Config.UI.StaticPerspective then return end
    Wait(250)
    Voice.Hold(false)
end, false)

Perspective.Thread(true)
