import { PutItemCommand } from "dynamodb-toolbox/entity/actions/put";
import type { ServiceContext } from "../context.js";

export async function writeAgentLog(
  ctx: ServiceContext,
  entry: {
    agentId: string;
    taskId: string | null;
    role: "agent" | "user" | "system" | "tool";
    content: string;
  },
) {
  const now = new Date().toISOString();
  const id = crypto.randomUUID();

  await ctx.resources.ddb.entities.AgentLog.build(PutItemCommand)
    .item({
      id,
      agentId: entry.agentId,
      taskId: entry.taskId,
      role: entry.role,
      content: entry.content,
      createdAt: now,
    })
    .send();

  return { id, createdAt: now };
}
