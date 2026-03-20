import {
  createServer,
  type IncomingMessage,
  type Server,
  type ServerResponse,
} from "node:http";
import type { Socket } from "node:net";
import { shell } from "electron";

export const REDIRECT_PORT = 19284;
const TIMEOUT_MS = 5 * 60 * 1000;

export class CancelledError extends Error {
  constructor() {
    super("Login cancelled");
    this.name = "CancelledError";
  }
}

export function isCancelledError(err: unknown): boolean {
  return err instanceof CancelledError;
}

type RequestHandler = (
  req: IncomingMessage,
  res: ServerResponse,
  resolve: (value: unknown) => void,
  reject: (reason: unknown) => void,
  cleanup: () => void,
) => void;

interface CallbackServerOptions {
  handler: RequestHandler;
  authUrl: string;
}

let activeServer: Server | null = null;
let activeSockets: Set<Socket> | null = null;
let cancelCurrent: (() => void) | null = null;

/** Force-close the active server and wait for the port to be released. */
function forceCloseActive(): Promise<void> {
  return new Promise<void>((resolve) => {
    if (!activeServer) {
      resolve();
      return;
    }
    const server = activeServer;
    const sockets = activeSockets;
    activeServer = null;
    activeSockets = null;
    cancelCurrent = null;

    if (sockets) {
      for (const socket of sockets) {
        socket.destroy();
      }
      sockets.clear();
    }
    server.close(() => resolve());
  });
}

export function cancelActiveFlow(): void {
  cancelCurrent?.();
}

/**
 * Starts a local HTTP server on REDIRECT_PORT, opens the auth URL in the
 * browser, and waits for the handler to resolve or reject.
 *
 * Awaits full close of any previous server before binding the port.
 */
export async function startCallbackServer<T>(
  opts: CallbackServerOptions,
): Promise<T> {
  // Wait for any previous server to fully release the port
  await forceCloseActive();

  return new Promise<T>((resolve, reject) => {
    const sockets = new Set<Socket>();

    const server = createServer((req: IncomingMessage, res: ServerResponse) => {
      opts.handler(
        req,
        res,
        resolve as (value: unknown) => void,
        reject,
        cleanup,
      );
    });

    activeServer = server;
    activeSockets = sockets;

    server.on("connection", (socket) => {
      sockets.add(socket);
      socket.on("close", () => sockets.delete(socket));
    });

    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error("Auth flow timed out (5 minutes)"));
    }, TIMEOUT_MS);

    function cleanup() {
      clearTimeout(timeout);
      for (const socket of sockets) {
        socket.destroy();
      }
      sockets.clear();
      server.close();
      if (activeServer === server) {
        activeServer = null;
        activeSockets = null;
        cancelCurrent = null;
      }
    }

    cancelCurrent = () => {
      cleanup();
      reject(new CancelledError());
    };

    server.listen(REDIRECT_PORT, "127.0.0.1", () => {
      shell.openExternal(opts.authUrl);
    });

    server.on("error", (err) => {
      cleanup();
      reject(new Error(`Failed to start callback server: ${err.message}`));
    });
  });
}
