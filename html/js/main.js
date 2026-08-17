import * as bus from "./core/bus.js";
import { register as registerGameScreen } from "./components/game-screen.js";
import { register as registerNotify } from "./components/notify.js";
import { register as registerMinimapData } from "./components/minimap-data.js";
import { register as registerDefaultNotify } from "./components/default-notify.js";

// Components register their handlers here, then the bus opens the message port.
registerGameScreen(bus);
registerNotify(bus);
registerMinimapData(bus);
registerDefaultNotify(bus);

bus.start();
