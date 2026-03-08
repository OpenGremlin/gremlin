import { TerminateInstancesCommand } from "@aws-sdk/client-ec2";
import { describeSandboxInstances, ec2 } from "./sandboxHelpers.js";

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
    // biome-ignore lint/suspicious/noConsole: Lambda uses console for CloudWatch logs
    console.log("Terminating sandbox instances:", ids);
    await ec2.send(new TerminateInstancesCommand({ InstanceIds: ids }));
  } else {
    // biome-ignore lint/suspicious/noConsole: Lambda uses console for CloudWatch logs
    console.log("No sandbox instances to terminate");
  }
}
