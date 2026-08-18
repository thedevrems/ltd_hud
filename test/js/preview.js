/* Montage de la page de comparaison et de ses réglages.
 * Script classique, pour la même raison que designs.js : la page s'ouvre en
 * file://, où un module ES ne se charge pas.
 */

(function () {
    "use strict";

    var API = window.LTL_DESIGNS;
    var el = API.el;

    /* Les thèmes réécrivent les mêmes variables que multichar.js pousse depuis le
       Lua. La teinte de surface est FOURNIE et non calculée : mélanger deux
       couleurs n'a pas de fonction css disponible dans le cef du jeu, et c'est
       pour ça que multichar.js la calcule en JavaScript de son côté. */
    var THEMES = {
        violet: { primary: "#8B5CF6", primaryRgb: "139, 92, 246", accent: "#C4B5FD", accentRgb: "196, 181, 253", tintRgb: "56, 36, 97", muted: "rgb(181, 168, 228)" },
        rouge:  { primary: "#ee1c3e", primaryRgb: "238, 28, 62",  accent: "#FFB3C0", accentRgb: "255, 179, 192", tintRgb: "74, 20, 30",  muted: "rgb(232, 176, 187)" },
        cyan:   { primary: "#22D3EE", primaryRgb: "34, 211, 238", accent: "#A5F3FC", accentRgb: "165, 243, 252", tintRgb: "13, 51, 62",  muted: "rgb(168, 217, 229)" },
        ambre:  { primary: "#F0A63C", primaryRgb: "240, 166, 60", accent: "#FCD9A0", accentRgb: "252, 217, 160", tintRgb: "70, 45, 14",  muted: "rgb(230, 205, 168)" },
        vert:   { primary: "#34D399", primaryRgb: "52, 211, 153", accent: "#A7F3D0", accentRgb: "167, 243, 208", tintRgb: "12, 56, 43",  muted: "rgb(168, 224, 203)" }
    };

    var state = {
        density: "confortable",
        logo: "on",
        theme: "violet",
        profil: "calme",
        opacity: 62,
        open: false
    };

    var host = document.getElementById("designs");
    var nav = document.getElementById("jump");
    var mounted = [];

    /* --------------------------------------------------------------- montage */

    function section(design, index) {
        var wrap = el("section", "shot");
        wrap.id = design.id;
        if (design.tall) wrap.dataset.tall = "1";

        var head = el("div", "shot-head");
        head.appendChild(el("span", "shot-num", String(index + 1).padStart(2, "0")));
        var titles = el("div", "shot-titles");
        titles.appendChild(el("h2", null, design.name));
        titles.appendChild(el("p", "shot-idea", design.idea));
        head.appendChild(titles);
        wrap.appendChild(head);

        var stage = el("div", "stage");
        wrap.appendChild(stage);

        var notes = el("ul", "shot-notes");
        design.notes.forEach(function (entry) {
            var li = el("li", entry[0] === "-" ? "minus" : null, entry[1]);
            notes.appendChild(li);
        });
        wrap.appendChild(notes);

        return { design: design, root: wrap, stage: stage, corner: null };
    }

    function renderCorner(entry) {
        var data = API.CASES[state.profil];
        var corner = API.build(entry.design, data, {
            density: state.density,
            logo: state.logo,
            open: state.open
        });
        applyTheme(corner);
        corner.style.setProperty("--hc-surface-opacity", String(state.opacity / 100));
        if (entry.corner) entry.stage.removeChild(entry.corner);
        entry.stage.appendChild(corner);
        entry.corner = corner;
    }

    function applyTheme(corner) {
        var theme = THEMES[state.theme];
        var style = corner.style;
        style.setProperty("--hc-primary", theme.primary);
        style.setProperty("--hc-primary-rgb", theme.primaryRgb);
        style.setProperty("--hc-accent", theme.accent);
        style.setProperty("--hc-accent-rgb", theme.accentRgb);
        style.setProperty("--hc-tint-rgb", theme.tintRgb);
        style.setProperty("--hc-muted", theme.muted);
    }

    function mount() {
        API.DESIGNS.forEach(function (design, index) {
            var entry = section(design, index);
            host.appendChild(entry.root);
            renderCorner(entry);
            mounted.push(entry);

            var link = el("a", "jump-link", String(index + 1));
            link.href = "#" + design.id;
            link.title = design.name;
            nav.appendChild(link);
        });
    }

    /* Reconstruire plutôt que muter : un design se juge sur ce qu'il produit à
       froid, et une page qui accumule des états intermédiaires finit par montrer
       quelque chose que le jeu n'affichera jamais. Dix blocs de sept champs, ça
       ne coûte rien. */
    function refresh() {
        mounted.forEach(renderCorner);
    }

    /* --------------------------------------------------------------- réglages */

    /* `data-control` sur les boutons, `data-<clé>` sur le body : deux noms
       distincts, pour qu'un querySelectorAll ne puisse jamais attraper le body et
       écraser son contenu en écrivant son textContent. */
    function pressed(control, value) {
        var buttons = document.querySelectorAll('[data-control="' + control + '"]');
        Array.prototype.forEach.call(buttons, function (button) {
            button.setAttribute("aria-pressed", String(button.dataset.value === value));
        });
    }

    function setControl(control, value) {
        if (control === "backdrop") document.body.dataset.backdrop = value;
        else if (control === "open") state.open = value === "1";
        else state[control] = value;
        pressed(control, value);
        if (control !== "backdrop") refresh();
    }

    Array.prototype.forEach.call(document.querySelectorAll("[data-control]"), function (button) {
        button.onclick = function () { setControl(button.dataset.control, button.dataset.value); };
    });

    var slider = document.getElementById("opacity");
    var readout = document.querySelector('output[for="opacity"]');

    slider.oninput = function () {
        state.opacity = Number(slider.value);
        readout.textContent = (state.opacity / 100).toFixed(2).replace(/^0/, "");
        mounted.forEach(function (entry) {
            entry.corner.style.setProperty("--hc-surface-opacity", String(state.opacity / 100));
        });
    };

    /* --------------------------------------------------------------- démarrage */

    mount();
    setControl("backdrop", "mixte");
    setControl("density", "confortable");
    setControl("logo", "on");
    setControl("theme", "violet");
    setControl("profil", "calme");
    setControl("open", "0");
    slider.value = "62";
    slider.oninput();
})();
