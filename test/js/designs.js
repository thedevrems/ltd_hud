/* Catalogue des dix dispositions, et le constructeur de DOM qu'elles partagent.
 *
 * Script CLASSIQUE, pas un module ES : la page est faite pour être ouverte
 * directement depuis le disque, et Chrome refuse un module servi en file://
 * (origine opaque, donc CORS). Un `import` ici rendrait la page blanche sur la
 * seule façon dont on va s'en servir.
 */

(function (global) {
    "use strict";

    /* Les sept données du bandeau, dans l'ordre de lecture retenu : le métier
       puis le gang puis le statut, et pour l'argent liquide/banque/sale. */
    var LABELS = {
        uuid: "Identifiant",
        job: "Métier",
        gang: "Gang",
        thug: "Petite frappe",
        cash: "Liquide",
        bank: "Banque",
        black: "Argent sale"
    };

    var IDENTITY = ["uuid", "job", "gang", "thug"];
    var MONEY = ["cash", "bank", "black"];
    var ALL = IDENTITY.concat(MONEY);

    /* Deux profils. Le second est le seul qui montre à quoi sert la hiérarchie de
       couleur : sans gang ni argent sale, tous les designs se ressemblent. */
    var CASES = {
        calme: {
            uuid: "9oyt", job: "Sans emploi", gang: "Aucun", thug: "Non",
            cash: "0 $", bank: "52 600 $", black: "0 $"
        },
        charge: {
            uuid: "9oyt", job: "Mécanicien · Chef d'atelier", gang: "Ballas · Soldat", thug: "Oui",
            cash: "1 240 $", bank: "52 600 $", black: "8 750 $"
        }
    };

    /* La seule règle de couleur du bandeau : ce qui ne dit rien s'estompe, ce qui
       porte un fait légal passe en ambre. Un gang nommé n'est ni l'un ni l'autre —
       c'est une information neutre, elle reste blanche. */
    function toneFor(key, value) {
        if (key === "gang") return value === "Aucun" ? "quiet" : null;
        if (key === "thug") return value === "Oui" ? "flag" : "quiet";
        if (key === "black") return value === "0 $" ? "quiet" : "flag";
        return null;
    }

    var DESIGNS = [
        {
            id: "d1", name: "Dossier", shape: "rows", rule: "y",
            idea: "La fiche personnage de ltl_multicharacter, couchée : un panneau, deux rangées, un filet là où le sens change.",
            notes: [
                ["+", "le plus proche des autres écrans du serveur"],
                ["+", "deux surfaces internes au lieu de huit cadres"],
                ["+", "le logo partage la surface, séparé par un simple filet"],
                ["-", "reste large : quatre données sur la première rangée"]
            ]
        },
        {
            id: "d2", tall: true, name: "Registre", shape: "rows", rule: "y",
            idea: "Portrait plutôt que paysage : intitulé à gauche, valeur alignée à droite, une ligne par donnée.",
            notes: [
                ["+", "largeur fixe et prévisible, quelle que soit la donnée"],
                ["+", "les montants s'alignent, donc se comparent"],
                ["-", "haut : mange le coin sur la verticale"],
                ["-", "sept lignes à parcourir là où deux rangées suffisaient"]
            ]
        },
        {
            id: "d3", name: "Bandeau", shape: "flat", rule: "y",
            idea: "La barre audio du loadingscreen : une pilule basse, tout sur une ligne, logo en médaillon au bout.",
            notes: [
                ["+", "l'empreinte la plus discrète des dix"],
                ["+", "ne masque presque rien de la scène"],
                ["-", "très large : sept données à la file"],
                ["-", "intitulés réduits, donc moins lisibles d'un coup d'œil"]
            ]
        },
        {
            id: "d4", name: "Onglet", shape: "rows", rule: "y",
            idea: "Le logo coiffe le panneau comme l'onglet d'un dossier, arrondi en haut seulement.",
            notes: [
                ["+", "la marque tient sa ligne sans voler de largeur aux données"],
                ["+", "le bloc se lit de haut en bas, dans l'ordre d'importance"],
                ["-", "deux surfaces à aligner : plus fragile si le logo change de taille"]
            ]
        },
        {
            id: "d5", name: "Modules", shape: "rows", rule: "y",
            idea: "Trois surfaces au lieu d'une — identité, argent, marque — séparées par du vide.",
            notes: [
                ["+", "chaque bloc se retire sans laisser de trou"],
                ["+", "correspond exactement aux interrupteurs de Config.Displayer.Visible"],
                ["-", "trois ombres portées, donc plus de bords à l'écran"]
            ]
        },
        {
            id: "d6", tall: true, name: "Ardoise", shape: "flat", rule: "x",
            idea: "La fiche personnage debout : logo en tête, filet d'accent, puis les données en deux colonnes.",
            notes: [
                ["+", "la continuité la plus forte avec l'écran de sélection"],
                ["+", "la grille dt/dd de .mc-card-fields, reprise telle quelle"],
                ["-", "le plus encombrant des dix"],
                ["-", "occupe le coin haut droit en entier"]
            ]
        },
        {
            id: "d7", name: "Tiroir", shape: "rows", rule: "y", collapsible: true,
            idea: "L'identité toujours visible, l'argent dans un tiroir qui ne s'ouvre qu'à la demande.",
            notes: [
                ["+", "le HUD au repos est deux fois plus petit"],
                ["+", "admet qu'un solde bancaire n'a pas à être lu en permanence"],
                ["-", "demande une touche, donc une ligne de config et un keybind"],
                ["-", "une donnée cachée est une donnée qu'on oublie d'avoir"]
            ]
        },
        {
            id: "d8", name: "Nu", shape: "rows", rule: "y",
            idea: "Aucune surface : les valeurs posées à même la scène, décollées par une ombre, comme le nom du serveur au chargement.",
            notes: [
                ["+", "ne cache rien du jeu, ne coûte rien à composer"],
                ["+", "le plus proche d'un HUD diégétique"],
                ["-", "illisible sur un décor clair et chargé — testez le fond Jour"],
                ["-", "perd le rattachement visuel au reste des écrans"]
            ]
        },
        {
            id: "d9", name: "Grille", shape: "flat", rule: "y",
            idea: "Une seule surface découpée en cases par des filets, chaque donnée dans une case de même largeur.",
            notes: [
                ["+", "l'œil apprend une fois où regarder, et ça ne bouge plus"],
                ["+", "un métier long n'élargit plus tout le bandeau"],
                ["-", "des cases à moitié vides quand la valeur est courte"],
                ["-", "le plus « tableau de bord », le moins « jeu »"]
            ]
        },
        {
            id: "d10", name: "Insigne", shape: "rows", rule: "y",
            idea: "Logo en bloc carré à gauche avec l'identifiant sous lui : la marque et le joueur forment un seul insigne.",
            notes: [
                ["+", "la marque est lue en premier, sans écraser les données"],
                ["+", "l'identifiant est là où on le cherche : avec l'identité"],
                ["-", "le logo devient obligatoire : sans lui l'insigne est vide"]
            ]
        }
    ];

    /* ------------------------------------------------------------ helpers DOM */

    function el(tag, className, text) {
        var node = document.createElement(tag);
        if (className) node.className = className;
        if (text != null) node.textContent = text;
        return node;
    }

    function valueNode(key, value) {
        var node = el("span", "hc-value");
        if (key === "uuid") {
            node.appendChild(el("span", "hc-hash", "#"));
            node.appendChild(document.createTextNode(value));
        } else {
            node.textContent = value;
        }
        var tone = toneFor(key, value);
        if (tone) node.dataset.tone = tone;
        return node;
    }

    function fieldNode(key, value) {
        var node = el("div", "hc-field hc-field-" + key);
        node.appendChild(el("span", "hc-label", LABELS[key]));
        node.appendChild(valueNode(key, value));
        return node;
    }

    function rowNode(group, keys, data) {
        var row = el("div", "hc-row");
        row.dataset.group = group;
        keys.forEach(function (key) { row.appendChild(fieldNode(key, data[key])); });
        return row;
    }

    /* ------------------------------------------------------------ constructeur */

    /* Une seule fonction pour les dix : la forme du balisage ne change que quand
       la structure change vraiment (deux rangées, ou sept champs à plat). Tout le
       reste est du CSS, et c'est ce qui rend le portage vers ltl_hud petit. */
    function build(design, data, options) {
        options = options || {};

        var root = el("div", "hud-corner hc-enter");
        root.dataset.design = design.id;
        root.dataset.shape = design.shape;
        root.dataset.density = options.density || "confortable";
        root.dataset.logo = options.logo || "on";
        if (design.collapsible) root.dataset.open = options.open ? "1" : "0";

        var shell = el("div", "hc-shell hc-panel");

        var rule = el("span", "hc-rule");
        rule.dataset.axis = design.rule;
        rule.setAttribute("aria-hidden", "true");
        shell.appendChild(rule);

        var body = el("div", "hc-body");
        if (design.shape === "flat") {
            ALL.forEach(function (key) { body.appendChild(fieldNode(key, data[key])); });
        } else {
            body.appendChild(rowNode("identity", IDENTITY, data));
            body.appendChild(rowNode("money", MONEY, data));
        }
        shell.appendChild(body);

        var logo = el("div", "hc-logo");
        var img = el("img");
        /* Le logo de la ressource, lu sans la modifier : ce dossier ne touche à
           rien dans ltl_hud. */
        img.src = "../ltl_hud/html/logo.png";
        img.alt = "";
        logo.appendChild(img);
        /* L'insigne porte l'identifiant sous la marque, et masque celui de la
           rangée d'identité pour ne pas le dire deux fois. */
        logo.appendChild(el("span", "hc-badge-id", "#" + data.uuid));
        shell.appendChild(logo);

        root.appendChild(shell);
        return root;
    }

    global.LTL_DESIGNS = {
        DESIGNS: DESIGNS,
        CASES: CASES,
        LABELS: LABELS,
        toneFor: toneFor,
        build: build,
        el: el
    };
})(window);
