import { startHealthServer } from "./health.js";
import { createLogger } from "./log.js";
import { startRelay } from "./relay.js";

const log = createLogger("startup");

const WS_PORT = Number(process.env.WS_PORT ?? 8080);
const HEALTH_PORT = Number(process.env.HEALTH_PORT ?? 8083);

log.info(
  {
    wsPort: WS_PORT,
    healthPort: HEALTH_PORT,
    nodeVersion: process.version,
    pid: process.pid,
  },
  "Sandbox starting",
);

startRelay(WS_PORT);
startHealthServer(HEALTH_PORT);

log.info("All services started");
