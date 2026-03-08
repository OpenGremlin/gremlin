import {
  CreateScheduleCommand,
  type FlexibleTimeWindowMode,
} from "@aws-sdk/client-scheduler";
import {
  getSchedulerClient,
  getSchedulerConfig,
  log,
} from "./schedulerClient.js";

/**
 * Create a one-shot EventBridge schedule for an agent self-follow-up.
 * Auto-deletes after firing (ActionAfterCompletion: DELETE).
 */
export async function createFollowUpSchedule(input: {
  taskId: string;
  agentId: string;
  delayMs: number;
  prompt: string;
}) {
  const config = getSchedulerConfig();
  if (!config) return;

  const fireAt = new Date(Date.now() + input.delayMs);
  const scheduleId = crypto.randomUUID();

  await getSchedulerClient().send(
    new CreateScheduleCommand({
      Name: `gremlin-followup-${scheduleId}`,
      GroupName: "gremlin",
      ScheduleExpression: `at(${fireAt.toISOString().replace(/\.\d{3}Z$/, "")})`,
      FlexibleTimeWindow: { Mode: "OFF" as FlexibleTimeWindowMode },
      ActionAfterCompletion: "DELETE",
      Target: {
        Arn: config.targetArn,
        RoleArn: config.roleArn,
        Input: JSON.stringify({
          type: "agent_self_followup",
          agentId: input.agentId,
          payload: {
            taskId: input.taskId,
            prompt: input.prompt,
          },
        }),
      },
    }),
  );

  log.info(
    { scheduleId, fireAt: fireAt.toISOString() },
    "Created follow-up schedule",
  );

  return { scheduleId, fireAt: fireAt.toISOString() };
}
