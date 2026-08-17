VehicleCard = {}

VehicleCard.PreData = {
    dimensions = { width = 1400, height = 500 },
    stream     = "generic_texture_renderer",
    TXD_name   = "ltl_ui_vehiclecard",
    TXD        = CreateRuntimeTxd("ltl_ui_vehiclecard_main"),
    URL        = "https://cfx-nui-" .. GetCurrentResourceName() .. "/sprites/vehiclecard.html",
}

VehicleCard.DUI        = {}
VehicleCard.ScaleformID = false

function VehicleCard.InvokeFrame()
    VehicleCard.DUI.name = CreateDui(
        VehicleCard.PreData.URL,
        VehicleCard.PreData.dimensions.width,
        VehicleCard.PreData.dimensions.height)

    while not IsDuiAvailable(VehicleCard.DUI.name) do Wait(0) end

    VehicleCard.DUI.handle = GetDuiHandle(VehicleCard.DUI.name)
    VehicleCard.DUI.txt    = CreateRuntimeTextureFromDuiHandle(
        VehicleCard.PreData.TXD, VehicleCard.PreData.TXD_name, VehicleCard.DUI.handle)

    debugPrint("[^2VEHICLE CARD^7] Invoked frame [/]")
end

function VehicleCard.PrepareScaleform()
    debugPrint("[^2VEHICLE CARD^7] Preparing Scaleform [/]")
    local scaleformId = RequestScaleformMovie(VehicleCard.PreData.stream)
    while not HasScaleformMovieLoaded(scaleformId) do Wait(0) end

    debugPrint("[^2VEHICLE CARD^7] Scaleform created")
    VehicleCard.ScaleformID = scaleformId

    PushScaleformMovieFunction(VehicleCard.ScaleformID, "SET_TEXTURE")
    PushScaleformMovieMethodParameterString(VehicleCard.PreData.TXD_name .. "_main")
    PushScaleformMovieMethodParameterString(VehicleCard.PreData.TXD_name)
    PushScaleformMovieFunctionParameterInt(0)
    PushScaleformMovieFunctionParameterInt(0)
    PushScaleformMovieFunctionParameterInt(1400)
    PushScaleformMovieFunctionParameterInt(500)
    PopScaleformMovieFunctionVoid()
end

function VehicleCard.FrameTick(coords, offset)
    DrawScaleformMovie_3dSolid(
        VehicleCard.ScaleformID,
        coords,
        0.0, 0.0,
        0.0 - offset.z,
        0.0, 90.0, 90.0,
        90.0, 0.11, 0.061875,
        1, 0)
end

function VehicleCard.SetScreen(screen, data)

end

function VehicleCard.Destroy()
    if VehicleCard.ScaleformID then
        debugPrint("[^2VEHICLE CARD^7] Destroying [/]")
        SetScaleformMovieAsNoLongerNeeded(VehicleCard.ScaleformID)
        Wait(100)
        VehicleCard.ScaleformID = false
        debugPrint("[^2VEHICLE CARD^7] Destroyed")
    end
end
