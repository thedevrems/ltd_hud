Config.Chat = {}
Config.Chat.Use = true

Config.Chat.Icons = {
    ['me'] = 'ME',
    ['do'] = 'DO',
    ['ooc'] = 'OOC',
    ['twt'] = 'fas fa-twitter',
    -- La puce d'une ligne du canal staff.
    ['staff'] = 'fas fa-shield-alt',
}

Config.Chat.AllowUserChangeSize = true
Config.Chat.Size = 'small'

Config.Chat.Translate = {
    ['player_with_id'] = 'Joueur ID',
    ['enter_message'] = 'Entrez une commande / un message'
}

Config.Chat.UseCommandsWithoutSyntax = false

-- The input only ever needs the keyboard. The cursor is what makes the action
-- buttons attached to a message clickable, so turn it back on only if the server
-- actually sends messages with `actionButtons`.
Config.Chat.UseCursorOnInput = false

-- =============================================
-- Canal descendant
-- =============================================

-- Qui peut ÉCRIRE dans le canal. À vrai, seul un staff — quiconque détient un
-- grade de poids strictement supérieur à 0 dans ltl_permissions.
--
-- LA SAISIE, ELLE, S'OUVRE POUR TOUT LE MONDE dans les deux cas : c'est aussi par
-- là qu'on lance une commande, et les commandes ne sont pas une affaire de staff.
-- Les suggestions affichées sous la boîte sont filtrées par ACE, donc chacun n'y
-- voit que les siennes.
--
-- Ce n'est pas réglable par grade ici, et c'est volontaire : la réponse
-- appartient au serveur, et elle se règle dans l'éditeur de grades du menu
-- admin. Un fichier partagé que le client lit ne peut pas garder une décision.
--
-- Le refus est SILENCIEUX : un joueur sans grade qui tape autre chose qu'une
-- commande voit sa ligne disparaître sans rien envoyer. À faux, tout le monde
-- écrit dans le canal, sans grade ni pastille.
Config.Chat.StaffOnly = true

-- Durée d'affichage du tchat après l'arrivée d'un message, en millisecondes.
--
-- Le compteur repart de zéro à chaque nouveau message : dix lignes en rafale
-- laissent le tchat visible ce délai après la dernière, pas après la première.
-- Une saisie ouverte le tient allumé sans compter.
Config.Chat.VisibleMs = 8000

-- Longueur maximale d'un message, en OCTETS.
--
-- Coupée côté serveur, jamais côté client : la saisie du navigateur est une
-- commodité, pas une garde. Un accent compte pour deux octets, et la coupe
-- s'arrête à une frontière de codepoint — voir Chat.Clean.
Config.Chat.MaxLength = 256

-- Nombre de messages gardés dans la page. Au-delà, le plus ancien est retiré du
-- document et rendu au Lua (callback `chat.poolSizeMessageRemoved`).
--
-- Ce n'est pas un réglage de confort : une page NUI qui accumule des milliers de
-- nœuds finit par coûter des images par seconde au jeu, et personne ne relit la
-- millième ligne d'un tchat qui s'efface au bout de huit secondes.
Config.Chat.MaxPoolSize = 60

-- Nombre de suggestions de commandes affichées sous la saisie. Un serveur bien
-- fourni en enregistre plusieurs centaines : au-delà d'une poignée, la liste
-- couvre l'écran au lieu de le renseigner.
Config.Chat.SuggestionLimit = 5

-- Deux couloirs de limitation, calibrés sur ce que chacun coûte.
--
-- Une ouverture refusée ne coûte qu'un aller-retour, donc elle peut être
-- généreuse. Un envoi atteint le journal ET tous les clients connectés, donc
-- c'est celui-là qui doit tenir.
Config.Chat.RateLimit = {
    open = { max = 6, windowMs = 3000 },
    send = { max = 4, windowMs = 4000 },
}
