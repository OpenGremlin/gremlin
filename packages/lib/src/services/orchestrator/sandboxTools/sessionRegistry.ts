import type { SandboxSession } from "../../sandbox/types.js";
import { log } from "./logger.js";

const IDLE_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes

// In-memory map of active sandbox sessions keyed by taskId (exported for browser tools)
export const activeSessions = new Map<string, SandboxSession>();

// Periodically close sessions that have been idle for too long.
// If no sessions remain for a given sandbox instance, terminate it.
//
// `.unref()` lets Node exit when this interval is the only thing keeping
// the event loop alive — important for CLI scripts that import this
// module and for Vitest's graceful shutdown. Guarded with `?.` because
// the interval return type in some test runtimes (edge-like environments)
// lacks the method.
const idleReaperInterval = setInterval(async () => {
  const now = Date.now();
  const idleTasks: string[] = [];

  for (const [taskId, session] of activeSessions) {
    if (now - session.lastActivityAt > IDLE_TIMEOUT_MS) {
      idleTasks.push(taskId);
    }
  }

  for (const taskId of idleTasks) {
    const session = activeSessions.get(taskId);
    if (!session) continue;

    const { agentId, instanceId } = session;
    log.info(
      { taskId, agentId, instanceId, idleMs: now - session.lastActivityAt },
      "Closing idle sandbox session",
    );

    // Close the WebSocket and remove from map
    session.ws?.close();
    activeSessions.delete(taskId);

    // If no other sessions use this instance, terminate it
    const stillInUse = [...activeSessions.values()].some(
      (s) => s.instanceId === instanceId,
    );
    if (!stillInUse) {
      try {
        const { terminateSandbox } = await import(
          "../../sandbox/terminateSandbox.js"
        );
        await terminateSandbox(session);
        log.info(
          { agentId, instanceId },
          "Terminated sandbox — no remaining sessions",
        );
      } catch (err) {
        log.error(
          { agentId, instanceId, error: (err as Error).message },
          "Failed to terminate idle sandbox",
        );
      }
    }
  }
}, 60_000);
idleReaperInterval.unref?.();
