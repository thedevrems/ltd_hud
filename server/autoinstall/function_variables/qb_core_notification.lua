local payload = {
    action = "notify",
    type   = texttype or "primary",
    length = length   or 5000,
}

if type(text) == "table" then
    payload.text    = text.text    or "Placeholder"
    payload.caption = text.caption or false
else
    payload.text = text
end

if icon then
    payload.icon = icon
else
    if     texttype == "success" then payload.icon = "fas fa-check"
    elseif texttype == "error"   then payload.icon = "fas fa-exclamation-triangle"
    else                              payload.icon = "fas fa-info"
    end
end

exports.ltl_hud:Notification(payload.caption, payload.text, payload.icon, payload.length)
