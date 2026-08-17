CarHud = {}

function CarHud.UpdateKeyValue(key, value)
    NUI.SendMessage("UPDATE_CARHUD_VALUE", { key = key, value = value })
end
