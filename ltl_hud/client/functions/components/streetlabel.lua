StreetLabel = {}

function StreetLabel.SetVisible(state)
    if not Config.UI.UseStreetLabel then return end
    NUI.SendMessage("SET_STREETLABEL_VISIBILITY", { state = state })
end

function StreetLabel.SetStreetLabelData(data)
    if not Config.UI.UseStreetLabel then return end
    NUI.SendMessage("SET_STREETLABEL_DATA", data)
end
