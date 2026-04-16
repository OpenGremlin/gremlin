import type { ServiceContext } from "../../../context.js";
import type { SandboxSession } from "../../../sandbox/types.js";
import { activeSessions } from "../sessionRegistry.js";

const BOOT_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes
const POLL_FAST_MS = 1_000; // 1s for first 15s (catches hibernate resumes)
const POLL_SLOW_MS = 3_000; // 3s after that (cold boot)
const POLL_FAST_WINDOW_MS = 15_000;

/**
 * Ensure a connected sandbox session exists for the agent.
 * Blocks until the sandbox is healthy and connected, or throws on timeout.
 */
export async function ensureSandbox(
  ctx: ServiceContext,
  agentId: string,
  taskId: string,
): Promise<SandboxSession> {
  // Already connected for this task
  const existing = activeSessions.get(taskId);
  if (existing?.ws && existing.ws.readyState === existing.ws.OPEN) {
    return existing;
  }

  // Read agent record to get existing instanceId
  const agent = await ctx.services.agents.getAgent(ctx, agentId);
  const existingInstanceId = agent?.sandboxInstanceId;

  ctx.log.info(
    { agentId, existingInstanceId, component: "sandbox:tools" },
    "Ensuring sandbox is available",
  );

  // Try quick connect to an already-running instance (or local sandbox)
  if (existingInstanceId || process.env.SANDBOX_LOCAL === "true") {
    const session = await ctx.services.sandbox.tryQuickConnect(
      agentId,
      existingInstanceId ?? "local",
    );
    if (session) {
      await ctx.services.sandbox.connectToSandbox(session);
      session.lastActivityAt = Date.now();
      activeSessions.set(taskId, session);
      ctx.log.info(
        {
          agentId,
          taskId,
          instanceId: session.instanceId,
          component: "sandbox:tools",
        },
        "Quick-connected to existing sandbox",
      );
      return session;
    }
  }

  // Cold start — launch EC2 (or start stopped instance) then poll until ready
  const instanceId = await ctx.services.sandbox.launchInstance(
    agentId,
    existingInstanceId,
  );

  // Persist instanceId if it changed
  if (instanceId !== existingInstanceId) {
    await ctx.services.agents.updateAgent(ctx, agentId, {
      sandboxInstanceId: instanceId,
    });
  }

  ctx.log.info(
    { agentId, instanceId, component: "sandbox:tools" },
    "Waiting for sandbox to become healthy",
  );

  // Poll until the sandbox is healthy and we can connect.
  // Uses fast polling initially (catches hibernate resumes quickly),
  // then backs off for cold boots to reduce API calls.
  const startedAt = Date.now();
  const deadline = startedAt + BOOT_TIMEOUT_MS;
  while (Date.now() < deadline) {
    const elapsed = Date.now() - startedAt;
    const interval =
      elapsed < POLL_FAST_WINDOW_MS ? POLL_FAST_MS : POLL_SLOW_MS;
    await new Promise((r) => setTimeout(r, interval));

    const session = await ctx.services.sandbox.tryQuickConnect(
      agentId,
      instanceId,
    );
    if (session) {
      await ctx.services.sandbox.connectToSandbox(session);
      session.lastActivityAt = Date.now();
      activeSessions.set(taskId, session);
      ctx.log.info(
        { agentId, taskId, instanceId, component: "sandbox:tools" },
        "Sandbox connected after cold boot",
      );
      return session;
    }
  }

  throw new Error(
    `Sandbox failed to become healthy within ${BOOT_TIMEOUT_MS / 1000}s`,
  );
}
