import { startHealthServer } from "./health.js";
import { startRelay } from "./relay.js";

const WS_PORT = Number(process.env.WS_PORT ?? 8080);
const HEALTH_PORT = Number(process.env.HEALTH_PORT ?? 8081);

startRelay(WS_PORT);
startHealthServer(HEALTH_PORT);

console.log(`Sandbox ready — WS :${WS_PORT}, health :${HEALTH_PORT}`);
