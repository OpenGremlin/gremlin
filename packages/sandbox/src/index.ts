import { startBrowserBridge } from "./browser-bridge.js";
import { startHealthServer } from "./health.js";
import { createLogger } from "./log.js";
import { startRelay } from "./relay.js";

const log = createLogger("startup");

const WS_PORT = Number(process.env.WS_PORT ?? 8080);
const HEALTH_PORT = Number(process.env.HEALTH_PORT ?? 8083);
const BROWSER_BRIDGE_PORT = Number(process.env.BROWSER_BRIDGE_PORT ?? 9090);

log.info(
  {
    wsPort: WS_PORT,
    healthPort: HEALTH_PORT,
    browserBridgePort: BROWSER_BRIDGE_PORT,
    nodeVersion: process.version,
    pid: process.pid,
  },
  "Sandbox starting",
);

startRelay(WS_PORT);
startHealthServer(HEALTH_PORT);

if (process.env.DISABLE_BROWSER_BRIDGE !== "true") {
  startBrowserBridge(BROWSER_BRIDGE_PORT);
  log.info({ port: BROWSER_BRIDGE_PORT }, "Browser bridge started");
} else {
  log.info("Browser bridge disabled via DISABLE_BROWSER_BRIDGE");
}

log.info("All services started");
