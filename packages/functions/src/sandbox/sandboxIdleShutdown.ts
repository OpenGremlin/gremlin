import { StopInstancesCommand } from "@aws-sdk/client-ec2";
import { createLogger } from "@gremlin/lib/logger.js";
import { AgentEntity } from "@gremlin/lib/resources/ddb/schema/agent.js";
import { GetItemCommand } from "dynamodb-toolbox/entity/actions/get";
import { describeSandboxInstances, ec2, getTag } from "./sandboxHelpers.js";

const DEFAULT_IDLE_TIMEOUT_MS = 20 * 60 * 1000;
const log = createLogger("sandbox-sweeper");

export async function handler() {
  const instances = await describeSandboxInstances(["running"]);
  const now = Date.now();
  const stale: string[] = [];

  for (const instance of instances) {
    const agentId = getTag(instance, "gremlin:agentId");
    const instanceId = instance.InstanceId;
    if (!instanceId || !instance.LaunchTime) continue;

    const age = now - new Date(instance.LaunchTime).getTime();
    let timeoutMs = DEFAULT_IDLE_TIMEOUT_MS;
    let alwaysOn = false;

    if (agentId) {
      try {
        const { Item: agent } = await AgentEntity.build(GetItemCommand)
          .key({ id: agentId })
          .send();
        if (agent?.config?.sandbox) {
          alwaysOn = agent.config.sandbox.alwaysOn ?? false;
          if (agent.config.sandbox.idleTimeoutMinutes != null) {
            timeoutMs = agent.config.sandbox.idleTimeoutMinutes * 60 * 1000;
          }
        }
      } catch (err) {
        log.warn(
          { agentId, instanceId, err },
          "Failed to read agent config, using defaults",
        );
      }
    }

    if (alwaysOn) {
      log.info({ instanceId, agentId }, "Skipping always-on sandbox");
      continue;
    }

    if (age > timeoutMs) {
      stale.push(instanceId);
      log.info(
        {
          instanceId,
          agentId,
          ageMin: Math.round(age / 60000),
          timeoutMin: Math.round(timeoutMs / 60000),
        },
        "Sandbox exceeded idle timeout",
      );
    }
  }

  if (stale.length > 0) {
    log.info({ count: stale.length }, "Stopping idle sandbox instances");
    await ec2.send(new StopInstancesCommand({ InstanceIds: stale }));
  } else {
    log.info("No idle sandbox instances");
  }
  return { stopped: stale.length };
}
