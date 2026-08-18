# Dix dispositions pour le bandeau joueur

Propositions de remplacement du coin haut droit de `ltl_hud` — identifiant,
métier, gang, petite frappe, liquide, banque, argent sale, et le logo du serveur.

**Ouvrir `index.html` dans un navigateur**, en plein écran : les tailles suivent
la largeur de l'écran, une fenêtre étroite ment sur toutes les proportions.

Ce dossier ne modifie rien dans `ltl_hud`. Il n'y lit qu'un fichier,
`html/logo.png`, en lecture seule.

## Fichiers

| Fichier | Rôle |
| --- | --- |
| `css/tokens.css` | thème et primitives partagés — **le socle du livrable** |
| `css/designs.css` | les dix dispositions, une par bloc `[data-design="dN"]` |
| `css/preview.css` | habillage de la page de comparaison, jetable |
| `js/designs.js` | catalogue des dix + constructeur de DOM commun |
| `js/preview.js` | montage de la page et ses réglages, jetable |

Une disposition retenue, c'est **un bloc de `designs.css` plus une forme de
balisage** : tout le reste est déjà partagé.

## D'où vient le langage visuel

Repris de `ltl_multicharacter` (`web/css/multichar.css`) et de
`ltl_loadingscreen` (`web/assets/css/style.css`), qui partagent déjà le même
thème :

- violet `#8B5CF6` / `#6D28D9`, accent `#C4B5FD`, ambre `#F0A63C` pour
  « attention » sans être « erreur »
- surface **teintée** : le violet est mélangé dans le fond *avant* l'opacité
  (`--hc-tint-rgb`, valeur de `--mc-panel-tint-rgb`) — mélangé après, il se
  diluerait dans la scène et donnerait un gris sale
- filet d'accent en dégradé avec halo, l'élément signature de
  `.identity__rule`
- intitulé en capitales espacées au-dessus de sa valeur : le motif `dt`/`dd` de
  `.mc-card-fields`, la façon dont ce framework présente une donnée nommée
- logo posé nu, décollé par une ombre portée, comme `.logo__image`
- rayon 16 px, `cubic-bezier(0.22, 1, 0.36, 1)`

## Les contraintes, qui ne sont pas des goûts

Elles viennent des commentaires de ces deux ressources, et chacune a coûté un
bug à quelqu'un :

- **Aucune requête sortante.** Ni police, ni bibliothèque d'icônes. Depuis une
  NUI, elle échoue en silence dans la console cef. Corollaire assumé : ces dix
  propositions n'ont **aucune icône** — un intitulé « PETITE FRAPPE » dit ce
  qu'aucun pictogramme ne dira. La version actuelle de `ltl_hud` charge Font
  Awesome *et* Phosphor depuis deux CDN.
- **Pas de `color-mix()`.** Le cef embarqué a plusieurs versions de retard, et
  une déclaration qu'il ne comprend pas n'est pas approximée : elle est ignorée,
  sans erreur. Toutes les teintes dérivées passent par `rgba()` sur des canaux
  séparés.
- **Pas de `backdrop-filter`.** Une NUI est composée *au-dessus* du jeu par le
  moteur : côté page, derrière un panneau il n'y a pas la scène GTA mais le fond
  transparent du document. Le flou floute donc du vide et peint un rectangle
  noir à la place du panneau.
- **Tailles en `clamp()`, pas en `vw` brut.** `ltl_hud` dimensionne tout en `vw`,
  ce qui donne 8 px de texte en 1366 et un bandeau disproportionné en 4K.

## Les dix

| Nº | Nom | L'idée |
| --- | --- | --- |
| 1 | Dossier | la fiche personnage, couchée : un panneau, deux rangées, un filet là où le sens change |
| 2 | Registre | portrait, intitulé à gauche et valeur alignée à droite, une ligne par donnée |
| 3 | Bandeau | la barre audio du loadingscreen : une pilule basse, tout sur une ligne |
| 4 | Onglet | le logo coiffe le panneau comme l'onglet d'un dossier |
| 5 | Modules | trois surfaces — identité, argent, marque — que l'on retire séparément |
| 6 | Ardoise | la fiche personnage debout, données en deux colonnes |
| 7 | Tiroir | l'identité toujours visible, l'argent replié jusqu'à la demande |
| 8 | Nu | aucune surface, valeurs posées à même la scène |
| 9 | Grille | une surface découpée en cases de largeur égale |
| 10 | Insigne | le logo en bloc carré à gauche, l'identifiant sous lui |

## Réglages de la page

Décor (jour / nuit / mixte) · profil joueur (rien à signaler / gang + illégal) ·
densité · logo · tiroir du nº 7 · accent · opacité de surface.

Deux d'entre eux méritent d'être utilisés avant de trancher :

- **Décor jour.** Une surface translucide se juge sur ce qu'il y a derrière.
  C'est un décor sombre qui rendait invisible le cadre du logo dans la version
  actuelle, et c'est un décor clair qui disqualifie le nº 8.
- **Profil « gang + illégal ».** Sans gang ni argent sale, les dix se
  ressemblent : c'est le second profil qui montre à quoi sert la hiérarchie de
  couleur (estompé pour ce qui ne dit rien, ambre pour ce qui porte un fait
  légal).

## Vérification

`_work/test-designs.mjs` monte la page sous jsdom et contrôle 29 points :
structure des dix, propagation de chaque réglage, règles de ton, absence de
requête sortante. `node test-designs.mjs` depuis `_work/`.
