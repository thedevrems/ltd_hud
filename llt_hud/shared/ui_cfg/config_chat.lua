Config.Chat = {}
Config.Chat.Use = true

Config.Chat.Icons = {
    ['me'] = 'ME',
    ['do'] = 'DO',
    ['ooc'] = 'OOC',
    ['twt'] = 'fas fa-twitter',
}

Config.Chat.AllowUserChangeSize = true
Config.Chat.Size = 'small'

Config.Chat.Translate = {
    ['player_with_id'] = 'Player with ID',
    ['enter_message'] = 'Enter command/message'
}

Config.Chat.UseCommandsWithoutSyntax = false

-- The input only ever needs the keyboard. The cursor is what makes the action
-- buttons attached to a message clickable, so turn it back on only if the server
-- actually sends messages with `actionButtons`.
Config.Chat.UseCursorOnInput = false

Config.Chat.MaxPoolSize = false
