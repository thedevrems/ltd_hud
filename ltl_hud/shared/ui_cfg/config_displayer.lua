Config.Displayer = {}
Config.Displayer.Use = true

-- Chaque interrupteur nomme une puce du bandeau. `id` affiche l'UUID du
-- personnage — le code public à quatre caractères de ltl_core, celui que prennent
-- les commandes du framework — et non l'identifiant serveur, qui change à chaque
-- connexion et ne désigne personne d'une session à l'autre.
--
-- `jobs` gouverne toutes les lignes de `base` que rien d'autre ne nomme ; `gang`
-- et `thug` ont le leur pour qu'un serveur sans illégal puisse les retirer sans
-- perdre le métier.
-- `logo` n'est pas une puce mais le bloc à droite du bandeau : il affiche
-- Config.Server.Logo, et disparaît de lui-même si aucun logo n'est configuré.
Config.Displayer.Visible = {
    ['id'] = true,
    ['jobs'] = true,
    ['gang'] = true,
    ['thug'] = true,
    ['wallets'] = true,
    ['addon'] = true,
    ['logo'] = true,
}
