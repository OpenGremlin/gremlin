import { UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { generateText, hasToolCall, type ModelMessage, type Tool } from "ai";
import type { ToolName } from "../../enums.js";
import type { ServiceContext } from "../context.js";
import { requestUserInputTool } from "../tools/index.js";
import { getModelForAgent } from "./model.js";
import { updateAgentLogResult, writeAgentLog } from "./writeAgentLog.js";

/** Tools marked as internal — logged for audit but hidden from the UI. */
const INTERNAL_TOOLS = new Set(["updateDocument"]);

/**
 * Wrap tools to emit a TOOL log entry (input only) when execution starts.
 * Returns the wrapped tools and a map of toolCallId → logEntryId for
 * updating the entry with the result later.
 */
function withEagerLogging(
  tools: Record<string, Tool>,
  ctx: ServiceContext,
  agentId: string,
  taskId: string | null,
): {
  tools: Record<string, Tool>;
  callLogIds: Map<string, { logId: string; createdAt: string }>;
} {
  const callLogIds = new Map<string, { logId: string; createdAt: string }>();
  const wrapped: Record<string, Tool> = {};
  for (const [name, t] of Object.entries(tools)) {
    if (INTERNAL_TOOLS.has(name)) {
      wrapped[name] = t;
      continue;
    }
    wrapped[name] = {
      ...t,
      execute: async (input: unknown, options: unknown) => {
        // Write call log immediately (no result yet)
        const { id: logId, createdAt } = await writeAgentLog(ctx, {
          agentId,
          taskId,
          role: "TOOL",
          toolName: name as ToolName,
          toolInput: input,
          toolResult: null,
          internal: false,
        });
        // Track by toolCallId from the AI SDK options
        const toolCallId = (options as { toolCallId?: string })?.toolCallId;
        if (toolCallId) callLogIds.set(toolCallId, { logId, createdAt });
        // @ts-expect-error — Tool execute signature varies
        return t.execute(input, options);
      },
    };
  }
  return { tools: wrapped, callLogIds };
}

export async function runAgentTurn(
  ctx: ServiceContext,
  opts: {
    agentId: string;
    taskId: string | null;
    systemPrompt: string;
    timezone?: string;
    memoryContext?: string;
    messages: ModelMessage[];
    tools?: Record<string, Tool>;
  },
): Promise<string> {
  const lane = opts.taskId ? `task:${opts.taskId}` : "main";
  const baseTools = {
    ...opts.tools,
    requestUserInput: requestUserInputTool(ctx, opts.agentId, lane),
  };

  // Wrap tools to emit a call log immediately when execution starts
  const { tools: allTools, callLogIds } = withEagerLogging(
    baseTools,
    ctx,
    opts.agentId,
    opts.taskId,
  );

  const tz = opts.timezone ?? "UTC";
  const currentTime = new Date().toLocaleString("en-US", { timeZone: tz });

  const { model, warning: modelWarning } = await getModelForAgent(
    ctx,
    opts.agentId,
  );
  ctx.log.info({ model: String(model) }, "Starting agent turn with model");

  if (modelWarning) {
    await writeAgentLog(ctx, {
      agentId: opts.agentId,
      taskId: opts.taskId,
      role: "SYSTEM",
      content: JSON.stringify({
        type: "model_fallback",
        message: modelWarning,
      }),
    });
  }
  // Track whether a command approval was created — if so, halt after this step
  let pendingCommandApproval = false;

  const onStepFinish = async (step: {
    toolCalls: Array<{
      toolName: string;
      toolCallId?: string;
      input?: unknown;
    }>;
    toolResults: Array<{ output?: unknown } | undefined>;
  }) => {
    for (let i = 0; i < step.toolCalls.length; i++) {
      const toolCall = step.toolCalls[i];
      const toolResult = step.toolResults[i];
      const isInternal = INTERNAL_TOOLS.has(toolCall.toolName);
      const toolCallId =
        "toolCallId" in toolCall ? (toolCall.toolCallId as string) : undefined;
      const existing = toolCallId ? callLogIds.get(toolCallId) : undefined;

      // Extract commandApprovalId from runCommand results
      const resultOutput = toolResult?.output as
        | Record<string, unknown>
        | undefined;
      const commandApprovalId =
        toolCall.toolName === "runCommand" && resultOutput?.commandApprovalId
          ? (resultOutput.commandApprovalId as string)
          : undefined;

      if (commandApprovalId) {
        pendingCommandApproval = true;
      }

      if (existing) {
        // If this is a command approval, back-fill the logEntryId on the
        // CommandApproval entity so resolveCommandApproval can update this
        // log entry later.
        if (commandApprovalId) {
          const table = ctx.resources.ddb.table;
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
          agentId: opts.agentId,
          taskId: opts.taskId,
          toolName: toolCall.toolName as ToolName,
          toolInput: "input" in toolCall ? toolCall.input : undefined,
          toolResult: toolResult?.output,
          commandApprovalId,
        });
      } else {
        await writeAgentLog(ctx, {
          agentId: opts.agentId,
          taskId: opts.taskId,
          role: "TOOL",
          toolName: toolCall.toolName as ToolName,
          toolInput: "input" in toolCall ? toolCall.input : undefined,
          toolResult: toolResult?.output,
          internal: isInternal,
        });
      }
    }
  };

  const buildMessages = (): ModelMessage[] => [
    {
      role: "system",
      content: opts.systemPrompt,
      providerOptions: {
        anthropic: { cacheControl: { type: "ephemeral" } },
      },
    },
    { role: "system", content: `Current time: ${currentTime} (${tz})` },
    ...(opts.memoryContext
      ? [{ role: "system" as const, content: opts.memoryContext }]
      : []),
    ...opts.messages,
  ];

  const result = await generateText({
    model,
    messages: buildMessages(),
    tools: allTools,
    stopWhen: [hasToolCall("requestUserInput"), () => pendingCommandApproval],
    onStepFinish,
  });

  // Log the final text response
  if (result.text) {
    await writeAgentLog(ctx, {
      agentId: opts.agentId,
      taskId: opts.taskId,
      role: "AGENT",
      content: result.text,
    });
  }

  return result.text;
}
