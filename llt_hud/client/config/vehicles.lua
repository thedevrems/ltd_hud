GetStreetLabel = function(coords)
    local StreetHash1, StreetHash2 = GetStreetNameAtCoord(coords.x, coords.y, coords.z)
    local Street1 = GetStreetNameFromHashKey(StreetHash1)
    local Street2 = GetStreetNameFromHashKey(StreetHash2)
    return {
        primary = Street1,
        secondary = Street2,
    }
end

GetFuel = function(entity)
    return GetVehicleFuelLevel(entity)
end

GetGear = function(entity)
    return GetVehicleCurrentGear(entity)
end
