Translations.UI = {}

Translations.UI['base'] = {
    ['store'] = 'Boutique',
    ['youtube'] = 'YouTube',
    ['discord'] = 'Discord'
}

Translations.UI['cinematic_mode'] = {
    ['show_hide_tooltips'] = 'Afficher/Masquer les infobulles',
    ['switch_preset'] = 'Changer de préréglage de caméra',
    ['toggle_cinematic_camera'] = 'Activer/Désactiver la caméra cinématique',
    ['leave'] = 'Quitter le mode cinématique',
    ['tip'] = 'Appuyez sur <span>MAJ</span> pour basculer la mise au point.'
}

Translations.UI['main_menu'] = {
    ['connected_in_as'] = 'Connecté en tant que',
    ['press_enter'] = 'Appuyez sur <span>ENTRÉE</span> pour continuer',
    ['hello'] = 'Bonjour',
    ['music_text'] = 'Indiquez la musique que vous souhaitez utiliser.',
    ['begin'] = "C'est parti",
    ['default_music'] = 'Utiliser la musique du serveur',
    ['paste_youtube'] = 'Collez un lien YouTube',
}

Translations.UI['welcome'] = {
    ['preview'] = 'Aperçu',
    ['color_picker'] = {
        header = 'Thème',
        text = "Choisissez la couleur de votre interface. Une palette de teintes vous est proposée pour personnaliser l'ensemble du HUD."
    },
    ['hud'] = {
        header = 'Interface du joueur',
        text = "Le HUD affiche à l'écran les informations essentielles de votre personnage : santé, faim, soif et autres statistiques."
    },
    ['carhud'] = {
        header = 'Interface du véhicule',
        text = "L'interface véhicule affiche les informations de conduite : vitesse, niveau de carburant et régime moteur."
    },
    ['notification'] = {
        header = 'Notifications',
        text = "Les notifications affichent en temps réel les alertes et les messages qui vous informent des évènements importants."
    },
    ['help_notify'] = {
        header = "Notification d'aide",
        text = "Les notifications d'aide vous donnent des indications ou des conseils, déclenchés par certaines actions en jeu."
    },
    ['progress_bar'] = {
        header = 'Barre de progression',
        text = "La barre de progression représente visuellement l'avancement d'une action en cours."
    },
}

Translations.UI['game_menu'] = {
    ['navbar'] = {
        ['interface_options'] = {
            ['interface'] = 'Interface',
            ['options'] = 'options'
        },
    },
    ['options'] = {
        ['change_interface'] = "Changer d'interface",
        ['components_visibility'] = 'Visibilité des composants',
        ['options'] = 'Options',

        ['use_3d'] = 'Affichage 3D',
        ['use_shadows'] = 'Ombres',
        ['smooth_edges'] = 'Bords adoucis',
        ['use_list'] = 'Afficher en liste',
        ['animation'] = 'Animation',
        ['background'] = 'Arrière-plan',
        ['refresh_intervals'] = 'Fréquence de rafraîchissement',
        ['use_minimap_outline'] = 'Contour du GPS',
        ['use_minimap_innershadow'] = 'Ombre interne du GPS',

        ['quality'] = 'Qualité',
        ['performance'] = 'Performance',
        ['stroke_width'] = 'Épaisseur du trait',
        ['thin'] = 'Fin',
        ['thick'] = 'Épais',
        ['quiet'] = 'Faible',
        ['loud'] = 'Fort',

        ['transparent'] = 'Transparent',
        ['full'] = 'Opaque',

        ['use_minimap_overlay'] = 'Surcouche du GPS',
        ['minimap_overlay'] = 'Surcouche',
        ['minimap_animation'] = 'Animation',
        ['music_url'] = 'Lien',
        ['music'] = 'Musique',
        ['minimap'] = 'GPS',
        ['menu_colors'] = 'Couleurs du menu',
        ['primary_color'] = 'Couleur principale',
        ['use_status_colors'] = 'Couleurs par statut',
        ['hud_status_colors'] = 'Couleurs des statuts',
        ['background_color'] = "Couleur d'arrière-plan",
        ['background_color_opacity'] = "Opacité de l'arrière-plan",
        ['interface_color'] = "Fond de l'interface",
        ['interface_color_opacity'] = "Opacité du fond de l'interface",

        ['chat'] = 'Tchat',
        ['chat_size'] = 'Taille'
    },
    ['animations'] = {
        ['default'] = 'Par défaut',
        ['45_degree'] = '45 degrés',
        ['fade'] = 'Fondu',
        ['zoom'] = 'Zoom',
        ['from_left'] = 'Depuis la gauche',
        ['from_top'] = 'Depuis le haut',
        ['from_right'] = 'Depuis la droite',
        ['from_bottom'] = 'Depuis le bas',
    },
    ['chat_sizes'] = {
        ['small'] = 'Petite',
        ['medium'] = 'Moyenne',
        ['big'] = 'Grande'
    }
}

Translations.UI['screens'] = {
    ['preview'] = {
        ['header'] = 'Aperçu',
        ['text'] = 'Ajustez la position de votre interface.',
        -- Notification affichée pendant toute la durée de l'aperçu (voir
        -- client/functions/components/preview.lua).
        ['notify'] = 'Vous pouvez déplacer, redimensionner et changer vos composants !',
    },
    ['position'] = {
        ['header'] = 'Mode positionnement',
        ['text'] = 'Ajustez la position de votre interface.',
        ['tip'] = 'Cliquez sur un élément pour afficher ses réglages.',
    }
}

Translations.UI['minimap'] = {
    ['reset_position'] = 'Réinitialiser la position des composants',
    ['accept_leave'] = 'Valider et quitter',
    ['back_to_customization'] = 'Retour au menu de personnalisation',
    ['toggle_radar'] = 'Afficher/Masquer le GPS'
}

Translations.UI['test_components'] = {
    ['help_notify'] = {
        header = "Notification d'aide",
        text = 'Rendez-vous à la position indiquée pour récupérer la marchandise.',
        icon = 'fas fa-envelope',
    },
    ['notification'] = {
        header = 'Notification',
        text = "Ceci est une notification de test !",
        icon = 'fas fa-envelope',
    },
    ['progress_bar'] = {
        icon = 'fas fa-leaf',
        text = 'Récolte de feuilles'
    }
}

Translations.UI['presets'] = {
    ['manual_customize'] = 'Personnaliser',
    ['manual_customize_text'] = 'Composez votre interface vous-même',
    ['presets'] = 'Préréglages du serveur',
    ['presets_text'] = "Utilisez les préréglages du serveur pour une expérience optimale",
    ['recommended'] = 'Recommandé'
}

Translations.UI['livesettings'] = {
    ['live_settings'] = 'Réglages en direct',
    ['hud'] = 'HUD',
    ['carhud'] = 'Interface véhicule',
    ['progressBar'] = 'Barre de progression',
    ['notify'] = 'Notifications',

    ['scale'] = 'Taille',
    ['align'] = 'Alignement',
}

-- Le menu pause traduit le TYPE d'un portefeuille par sa clé : `pause_menu.<clé>`,
-- où la clé est celle que GetUserWallets renvoie (server/config/player.lua).
-- Ajouter un compte demande donc d'ajouter sa ligne ici, sans quoi l'intitulé
-- reste vide au-dessus du montant.
Translations.UI['pause_menu'] = {
    ['cash'] = 'Liquide',
    ['bank'] = 'Banque',
    ['black'] = 'Argent sale',
    ['disconnect'] = 'Se déconnecter'
}

-- Bandeau d'informations du joueur, en haut à droite, et bloc identité du menu
-- pause. Lu côté serveur au moment de composer les lignes : `Translations` est un
-- fichier partagé, donc les deux runtimes voient les mêmes textes.
Translations.UI['player_info'] = {
    ['gang'] = 'Gang',
    -- Employé pour le gang `none` de ltl_core, qui est un gang comme un autre et
    -- non une absence de valeur.
    ['no_gang'] = 'Aucun',
    ['thug'] = 'Petite frappe',
    ['yes'] = 'Oui',
    ['no'] = 'Non',
}

-- Le bandeau du coin haut droit nomme chaque valeur au-dessus d'elle, à la place
-- de l'icône qu'il portait : « ARGENT SALE » se lit, un billet dessiné se devine.
-- La clé est celle de la ligne — `job`, `gang`, `thug` pour GetBaseRows, la clé du
-- compte pour un portefeuille (server/config/player.lua) — plus `id` pour l'UUID.
--
-- Une ligne qu'un serveur ajoute et qui ne figure pas ici s'affiche sans intitulé,
-- la valeur seule. Le champ `label` de la charge utile n'est délibérément PAS
-- repris en repli : il ne désigne pas la même chose selon la ligne — le nom du
-- métier pour `job`, le nom du champ pour un portefeuille — et le reprendre
-- afficherait « Mécanicien » comme intitulé du métier.
Translations.UI['displayer'] = {
    ['id'] = 'Identifiant',
    ['job'] = 'Métier',
    ['gang'] = 'Gang',
    ['thug'] = 'Petite frappe',
    ['cash'] = 'Liquide',
    ['bank'] = 'Banque',
    ['black'] = 'Argent sale',
}

Translations.UI['weapon_indicator'] = {
    ['weapon'] = 'Arme',
}

-- La ligne d'un staff dans le tchat : `[grade | libellé] Nom [en service] : texte`.
--
-- Les deux états de service s'écrivent toujours, jamais un seul : une pastille
-- absente confondrait « pas en service » et « le tchat n'en sait rien », qui ne
-- sont pas la même information quand on cherche qui répondait des actions de ce
-- moment-là. Quand le service est réellement inconnu, aucune pastille n'est
-- dessinée du tout — voir server/components/chat.lua.
Translations.UI['chat'] = {
    ['on_duty'] = 'en service',
    ['off_duty'] = 'pas en service',
}
