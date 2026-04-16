import type { ServiceContext } from "../../context.js";

export async function buildInputRequestReplyContent(
  ctx: ServiceContext,
  payload: { requestId: string; action: string },
): Promise<string> {
  const request = await ctx.services.userInputRequests.getUserInputRequest(
    ctx,
    payload.requestId,
  );

  if (request) {
    return `The user responded to your approval request.\nRequest: "${request.message}"\nUser selected: "${payload.action}"`;
  }
  return `The user responded to a request with action: ${payload.action}`;
}

/**
 * Load the original user input request and write a SYSTEM message to the
 * appropriate lane log with enough context to act on the reply.
 */
export async function formatAndWriteInputRequestReply(
  ctx: ServiceContext,
  agentId: string,
  taskId: string | null,
  payload: { requestId: string; action: string },
) {
  const content = await buildInputRequestReplyContent(ctx, payload);
  await ctx.services.orchestrator.writeAgentLog(ctx, {
    agentId,
    taskId,
    role: "SYSTEM",
    content,
  });
}
