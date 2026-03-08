import { StopInstancesCommand } from "@aws-sdk/client-ec2";
import { describeSandboxInstances, ec2 } from "./sandboxHelpers.js";

const MAX_AGE_MS = 30 * 60 * 1000; // 30 minutes

export async function handler() {
  const instances = await describeSandboxInstances(["running"]);
  const now = Date.now();
  const stale: string[] = [];
  for (const i of instances) {
    // biome-ignore lint/style/noNonNullAssertion: EC2 always returns LaunchTime for running instances
    const age = now - new Date(i.LaunchTime!).getTime();
    if (age > MAX_AGE_MS) {
      // biome-ignore lint/style/noNonNullAssertion: EC2 always returns InstanceId
      stale.push(i.InstanceId!);
      // biome-ignore lint/suspicious/noConsole: Lambda uses console for CloudWatch logs
      console.log(
        "Stale sandbox:",
        i.InstanceId,
        "age:",
        Math.round(age / 60000),
        "min",
      );
    }
  }
  if (stale.length > 0) {
    // biome-ignore lint/suspicious/noConsole: Lambda uses console for CloudWatch logs
    console.log("Stopping", stale.length, "idle sandbox instances");
    await ec2.send(new StopInstancesCommand({ InstanceIds: stale }));
  } else {
    // biome-ignore lint/suspicious/noConsole: Lambda uses console for CloudWatch logs
    console.log("No stale sandbox instances");
  }
  return { stopped: stale.length };
}
