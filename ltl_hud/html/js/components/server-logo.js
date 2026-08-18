import { setImageSource } from "../core/dom.js";
import { config } from "../core/config.js";

// Le logo du serveur, à droite des infos du joueur dans le coin haut droit.
//
// Composant à part et non partie du bandeau : il vit dans `#top-right-content`,
// le conteneur que les écrans de positionnement et d'aperçu empruntent en entier,
// alors que le bandeau ne possède que `#player-displayer`. Il suit donc les
// déplacements de bloc sans une ligne de plus.

let host = null;
let image = null;

// `Config.Server.Logo` est résolu par la page : un nom nu désigne un fichier posé
// à côté d'index.html, une URL https:// fonctionne aussi. Sans logo configuré, le
// bloc disparaît au lieu d'afficher un cadre vide.
function source() {
    return (config.state.Server && config.state.Server.Logo) || "";
}

function shown() {
    const displayer = config.state.Displayer || {};
    // `Use` à false éteint le coin entier, logo compris : c'est ce qu'un opérateur
    // qui coupe le bandeau attend. `Visible.logo` retire le seul logo, et son
    // absence de la config vaut « affiché », comme pour les autres puces.
    if (displayer.Use === false) return false;
    if (displayer.Visible && displayer.Visible.logo === false) return false;
    return source() !== "";
}

function render() {
    const visible = shown();
    host.style.display = visible ? "" : "none";
    if (visible) setImageSource(image, source());
}

export function register() {
    host = document.getElementById("server-logo");
    image = host.querySelector("img");
    config.subscribe(render);
    render();
}
