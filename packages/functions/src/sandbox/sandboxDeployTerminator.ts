import { TerminateInstancesCommand } from "@aws-sdk/client-ec2";
import { createLogger } from "@opengremlin/lib/logger.js";
import { describeSandboxInstances, ec2 } from "./sandboxHelpers.js";

const log = createLogger("sandbox-deploy-terminator");

interface CloudFormationCustomResourceEvent {
  RequestType: "Create" | "Update" | "Delete";
}

export async function handler(event: CloudFormationCustomResourceEvent) {
  if (event.RequestType === "Delete") return;

  const instances = await describeSandboxInstances([
    "running",
    "stopped",
    "pending",
  ]);
  const ids = instances
    .map((i) => i.InstanceId)
    .filter((id): id is string => !!id);

  if (ids.length > 0) {
    log.info({ ids }, "Terminating sandbox instances");
    await ec2.send(new TerminateInstancesCommand({ InstanceIds: ids }));
  } else {
    log.info("No sandbox instances to terminate");
  }
}
