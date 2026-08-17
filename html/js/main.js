import * as bus from "./core/bus.js";

// Components register their handlers here, then the bus opens the message port.
bus.start();
