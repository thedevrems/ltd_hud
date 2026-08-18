Effects.Focus = {}
Effects.Focus.InitialFov = 0

function Effects.Focus.Init(enable)
    local cam = GetRenderingCam()
    if enable then
        Effects.Focus.InitialFov = GetCamFov(cam)
        SetCamFov(cam, 120.0)
    else
        SetCamFov(cam, Effects.Focus.InitialFov)
    end
end
