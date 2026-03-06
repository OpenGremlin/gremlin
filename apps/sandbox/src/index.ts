import { startBrowserBridge } from "./browser-bridge.js";
import { startHealthServer } from "./health.js";
import { log } from "./log.js";
import { startRelay } from "./relay.js";

const WS_PORT = Number(process.env.WS_PORT ?? 8080);
const HEALTH_PORT = Number(process.env.HEALTH_PORT ?? 8083);
const BROWSER_BRIDGE_PORT = Number(process.env.BROWSER_BRIDGE_PORT ?? 9090);

log("startup", "Sandbox starting", {
  wsPort: WS_PORT,
  healthPort: HEALTH_PORT,
  browserBridgePort: BROWSER_BRIDGE_PORT,
  nodeVersion: process.version,
  pid: process.pid,
});

startRelay(WS_PORT);
startHealthServer(HEALTH_PORT);
startBrowserBridge(BROWSER_BRIDGE_PORT);

log("startup", "All services started");
