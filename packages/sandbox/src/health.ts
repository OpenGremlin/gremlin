import { createServer } from "node:http";
import { createLogger } from "./log.js";

const log = createLogger("health");

export function startHealthServer(port: number): void {
  const server = createServer((req, res) => {
    if (req.url === "/health" && req.method === "GET") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ status: "ok" }));
    } else {
      res.writeHead(404);
      res.end();
    }
  });

  server.listen(port);
  log.info({ port }, "Health server listening");
}
