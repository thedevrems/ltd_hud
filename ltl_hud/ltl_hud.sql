-- =============================================================================
--  ltl_hud — persistance de l'interface en base de données
-- =============================================================================
--
--  Le HUD n'est plus rangé dans le cache local du client FiveM (localStorage de
--  la NUI) mais dans cette table, indexée par l'IDENTIFIANT DU COMPTE — la
--  licence, pas le personnage. C'est ce choix qui fait qu'un joueur retrouve la
--  même interface sur chacun de ses persos.
--
--  ltl_hud crée la table lui-même au démarrage (server/components/settings.lua).
--  Ce fichier existe pour les opérateurs qui préfèrent appliquer leur schéma à
--  la main, ou dont l'utilisateur MySQL n'a pas le droit de faire un CREATE.
--
--  Rejouable sans risque.
-- =============================================================================

CREATE TABLE IF NOT EXISTS `ltl_hud_settings` (
  -- Même largeur que `users.identifier` : la licence brute, sans le préfixe
  -- `char1:` propre aux personnages.
  `identifier` varchar(60) NOT NULL,
  -- Document JSON complet : un objet par composant (hud, carhud, notifies,
  -- progressbar, helpnotify, misc, color, music) plus le drapeau `configured`
  -- qui dit si le joueur a déjà traversé l'écran de bienvenue.
  `settings` longtext NOT NULL,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`identifier`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
