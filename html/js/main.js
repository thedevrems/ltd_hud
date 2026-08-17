import * as bus from "./core/bus.js";
import { register as registerGameScreen } from "./components/game-screen.js";
import { register as registerNotify } from "./components/notify.js";
import { register as registerMinimapData } from "./components/minimap-data.js";
import { register as registerDefaultNotify } from "./components/default-notify.js";
import { register as registerPerspective } from "./components/perspective.js";
import { register as registerTextUI } from "./components/textui.js";
import { register as registerProgressBar } from "./components/progressbar.js";
import { register as registerHelpNotify } from "./components/helpnotify.js";
import { register as registerHud } from "./components/hud.js";
import { register as registerCarHud } from "./components/carhud.js";
import { register as registerVoice } from "./components/voice.js";
import { register as registerWeaponIndicator } from "./components/weapon-indicator.js";

// Components register their handlers here, then the bus opens the message port.
registerGameScreen(bus);
registerNotify(bus);
registerMinimapData(bus);
registerDefaultNotify(bus);
registerPerspective(bus);
registerTextUI(bus);
registerProgressBar(bus);
registerHelpNotify(bus);
registerHud(bus);
registerCarHud(bus);
registerVoice(bus);
registerWeaponIndicator(bus);

bus.start();
