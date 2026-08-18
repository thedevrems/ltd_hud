_DisplayRadar = DisplayRadar

Minimap = {}
Minimap.Visible  = false
Minimap.Prepared = false
Minimap.Selected = nil

Minimap.Types = {
    Basic = {
        minimap      = {"L", "B", -0.0045, 0.002,  0.15,     0.188888},
        minimap_mask = {"L", "B",  0.02,   0.032,  0.111,    0.159},
        minimap_blur = {"L", "B", -0.03,   0.022,  0.266,    0.237},
        txt = "basic", type = 0,
    },
    Radial = {
        minimap      = {"L", "B", -0.0045, 0.002,  0.15,     0.188888},
        minimap_mask = {"L", "B",  0.02,   0.032,  0.111,    0.159},
        minimap_blur = {"L", "B", -0.03,   0.022,  0.266,    0.237},
        txt = "radial", type = 0,
    },
    Wide = {
        minimap      = {"L", "B", -0.0045, -0.122, 0.24,     0.21},
        minimap_mask = {"L", "B",  0.0,     0.032, 0.111,    0.05},
        minimap_blur = {"L", "B", -0.03,    0.042, 0.266,    0.65},
        txt = "wide", type = 0,
    },
}

Minimap.Selected = Minimap.Types.Wide

function Minimap.UltraWide()
    local targetAspect = 1.7777777777777777
    local screenW, screenH = GetActiveScreenResolution()
    local aspectRatio = screenW / screenH
    if targetAspect < aspectRatio then
        return (targetAspect - aspectRatio) / 3.6
    end
    return 0
end

RegisterCommand("radar", function()
    _DisplayRadar(true)
end)

local function applyMinimapPositions(preset, ultraWideOffset)
    local m  = preset.minimap
    local mm = preset.minimap_mask
    local mb = preset.minimap_blur

    SetMinimapComponentPosition("minimap",      "L", "B", m[3]  + ultraWideOffset, m[4],  m[5],  m[6])
    SetMinimapComponentPosition("minimap_mask", "L", "B", mm[3] + ultraWideOffset, mm[4], mm[5], mm[6])
    SetMinimapComponentPosition("minimap_blur", "L", "B", mb[3] + ultraWideOffset, mb[4], mb[5], mb[6])
end

function Minimap.Prepare(minimapType)
    if Config.DisableMinimapHandler then
        Minimap.Prepared = true
        return
    end
    if Minimap.Prepared then return end

    Citizen.CreateThread(function()

        if IsScreenFadedOut() and not Minimap.Prepared then
            while IsScreenFadedOut() do Wait(100) end
        end

        debugPrint("[^5MINIMAP^7] Preparing [/]")
        Minimap.Selected = Minimap.Types[minimapType]

        Workers.Minimap.BeforePrepare()
        Wait(500)

        RequestScaleformMovie("minimap")
        RequestStreamedTextureDict("zsx_map", false)
        while not HasStreamedTextureDictLoaded("zsx_map") do Wait(100) end

        local ultraWideOffset = Minimap.UltraWide()
        AddReplaceTexture("platform:/textures/graphics", "radarmasksm", "zsx_map", Minimap.Selected.txt)
        _DisplayRadar(true)
        SetMinimapClipType(Minimap.Selected.type)
        applyMinimapPositions(Minimap.Selected, ultraWideOffset)

        SetRadarBigmapEnabled(true, false)
        SetRadarBigmapEnabled(false, false)
        SetRadarZoom(1100)
        Minimap.GetSize()
        Wait(100)
        _DisplayRadar(false)
        Workers.Minimap.AfterPrepare()
        Minimap.Prepared = true
        debugPrint("[^5MINIMAP^7] Minimap prepared.")
    end)
end

function Minimap.Change(minimapType)
    if Config.DisableMinimapHandler then return end

    CreateThread(function()
        Minimap.Selected = Minimap.Types[minimapType]

        local wasVisible = false
        if not IsRadarHidden() then
            wasVisible = true
            DisplayRadar(false)
        end

        Wait(500)
        RequestScaleformMovie("minimap")
        RequestStreamedTextureDict("zsx_map", false)
        while not HasStreamedTextureDictLoaded("zsx_map") do Wait(100) end

        AddReplaceTexture("platform:/textures/graphics", "radarmasksm", "zsx_map", Minimap.Selected.txt)
        SetMinimapClipType(Minimap.Selected.type)
        applyMinimapPositions(Minimap.Selected, 0)

        if minimapType == "Wide" then
            SetMinimapOverlayDisplay("minimap_mask", -0.0045, 0.002, 100, 150, 100)
        end

        SetRadarBigmapEnabled(true, false)
        SetRadarBigmapEnabled(false, false)
        SetRadarZoom(1100)
        Minimap.GetSize()
        Wait(100)

        if wasVisible then DisplayRadar(true) end
    end)
end

function Minimap.GetSize()
    local safeZone    = GetSafeZoneSize()
    local safeZoneX   = 0.05
    local safeZoneY   = 0.05
    local aspectRatio = GetAspectRatio(0)
    local screenW, screenH = GetActiveScreenResolution()
    local pixelW = 1.0 / screenW
    local pixelH = 1.0 / screenH

    local size = {}
    size.width    = (screenW / (4 * aspectRatio)) * pixelW * 100 + 0.05
    size.height   = (screenH / 5.674) * pixelH * 100 - 0.95

    local safeOffsetX = math.abs(safeZone - 1.0) * 10 * safeZoneX * screenW * pixelW * 100
    local safeOffsetY = 1.0 - math.abs(safeZone - 1.0) * 10 * safeZoneY * screenH * pixelH
    safeOffsetY = safeOffsetY * 100 - 1

    size.left_x   = safeOffsetX
    size.bottom_y = safeOffsetY
    size.right_x  = safeOffsetX + size.width
    size.top_y    = safeOffsetY - size.height
    size.x        = safeOffsetX * 100
    size.y        = size.top_y  * 100
    size.xunit    = pixelW
    size.yunit    = pixelH

    NUI.SendMessage("SET_RADAR_SIZE", size)
end

function Minimap.Animate(state, force)
    if Config.DisableMinimapHandler then return end
    NUI.SendMessage("SET_RADAR_VISIBILITY", { state = state, force = force })
end
