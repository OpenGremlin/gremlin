import { UpdateCommand } from "@aws-sdk/lib-dynamodb";
import type { ToolName } from "../../../enums.js";
import type { ServiceContext } from "../../context.js";
import { unwrapToolData } from "../../tools/toolResult.js";
import { updateAgentLogResult, writeAgentLog } from "../writeAgentLog.js";
import type { CallLogRef } from "./withEagerLogging.js";

export type StepEvent = {
  toolCalls: Array<{
    toolName: string;
    toolCallId?: string;
    input?: unknown;
  }>;
  toolResults: Array<{ output?: unknown } | undefined>;
  /**
   * Per-step token accounting from the AI SDK. For Anthropic/Bedrock,
   * `cachedInputTokens` is the count read from the prompt cache (billed at
   * 0.1× base input).
   */
  usage?: {
    inputTokens?: number;
    outputTokens?: number;
    totalTokens?: number;
    reasoningTokens?: number;
    cachedInputTokens?: number;
  };
  /**
   * Provider-specific metadata. For Bedrock, the cache *write* count surfaces
   * under `providerMetadata.bedrock.usage.cacheWriteInputTokens` (billed at
   * 1.25× for 5m TTL). Cache reads come through `usage.cachedInputTokens`.
   */
  providerMetadata?: Record<string, Record<string, unknown> | undefined>;
};

/**
 * Mutable ref shared with the outer turn so `streamText`'s `stopWhen`
 * predicate can halt inference once a command approval is requested.
 * Wrapping it in an object (rather than a boolean closure) keeps the
 * write site obvious — `flags.pendingApproval = true` vs. a callback
 * that only ever gets called with `true`.
 */
export interface TurnFlags {
  pendingApproval: boolean;
}

/**
 * Create the `onStepFinish` handler the AI SDK invokes after each tool-call
 * step. It finalises each TOOL log entry (previously written as input-only
 * by `withEagerLogging`) with the result, and flips `flags.pendingApproval`
 * when a runCommand result carries an approval id so the outer turn can halt.
 */
export function createOnStepFinish(
  ctx: ServiceContext,
  opts: {
    agentId: string;
    taskId: string | null;
    callLogIds: Map<string, CallLogRef>;
    flags: TurnFlags;
  },
) {
  const { agentId, taskId, callLogIds, flags } = opts;
  return async (step: StepEvent) => {
    // Log token usage with cache breakdown. Bedrock only surfaces cache
    // *writes* in `providerMetadata.bedrock.usage.cacheWriteInputTokens`;
    // cache *reads* come through as `step.usage.cachedInputTokens` (the
    // provider-agnostic field the binding populates from Bedrock's response).
    if (step.usage || step.providerMetadata) {
      const bedrockUsage = step.providerMetadata?.bedrock?.usage as
        | { cacheWriteInputTokens?: number }
        | undefined;
      ctx.log.info(
        {
          agentId,
          taskId,
          component: "model",
          inputTokens: step.usage?.inputTokens,
          outputTokens: step.usage?.outputTokens,
          cachedInputTokens: step.usage?.cachedInputTokens,
          cacheWriteTokens: bedrockUsage?.cacheWriteInputTokens,
        },
        "Model step usage",
      );
    }

    for (let i = 0; i < step.toolCalls.length; i++) {
      const toolCall = step.toolCalls[i];
      const toolResult = step.toolResults[i];
      const toolCallId =
        "toolCallId" in toolCall ? (toolCall.toolCallId as string) : undefined;
      const existing = toolCallId ? callLogIds.get(toolCallId) : undefined;

      // Extract commandApprovalId from runCommand results. The result is a
      // GremlinToolResult<R>, so unwrap the `data` payload first.
      const unwrapped = unwrapToolData(toolResult?.output) as Record<
        string,
        unknown
      > | null;
      const commandApprovalId =
        toolCall.toolName === "runCommand" && unwrapped?.commandApprovalId
          ? (unwrapped.commandApprovalId as string)
          : undefined;

      if (commandApprovalId) {
        flags.pendingApproval = true;
      }

      if (existing) {
        // If this is a command approval, back-fill the logEntryId on the
        // CommandApproval entity so resolveCommandApproval can update this
        // log entry later.
        if (commandApprovalId) {
          const table = ctx.resources.ddb.chatTable;
          await table
            .getDocumentClient()
            .send(
              new UpdateCommand({
                TableName: table.getName(),
                Key: {
                  pk: "COMMAND_APPROVAL",
                  sk: `COMMAND_APPROVAL#${commandApprovalId}`,
                },
                UpdateExpression:
                  "SET logEntryId = :logId, createdAt = :createdAt",
                ExpressionAttributeValues: {
                  ":logId": existing.logId,
                  ":createdAt": existing.createdAt,
                },
              }),
            )
            .catch((err) =>
              ctx.log.error(
                { err, commandApprovalId },
                "Failed to back-fill logEntryId on CommandApproval",
              ),
            );
        }
        await updateAgentLogResult(ctx, existing.logId, existing.createdAt, {
          agentId,
          taskId,
          toolName: toolCall.toolName as ToolName,
          toolInput: "input" in toolCall ? toolCall.input : undefined,
          toolResult: toolResult?.output,
          commandApprovalId,
        });
      } else {
        await writeAgentLog(ctx, {
          agentId,
          taskId,
          role: "TOOL",
          toolName: toolCall.toolName as ToolName,
          toolInput: "input" in toolCall ? toolCall.input : undefined,
          toolResult: toolResult?.output,
          internal: false,
        });
      }
    }
  };
}
