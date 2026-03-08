import {
  DescribeInstancesCommand,
  EC2Client,
  StopInstancesCommand,
} from "@aws-sdk/client-ec2";

const ec2 = new EC2Client({});
const MAX_AGE_MS = 30 * 60 * 1000; // 30 minutes

async function describeSandboxInstances(states: string[]) {
  const instances: Array<{
    InstanceId?: string;
    LaunchTime?: Date;
  }> = [];
  let nextToken: string | undefined;
  do {
    const res = await ec2.send(
      new DescribeInstancesCommand({
        Filters: [
          { Name: "tag:Name", Values: ["gremlin-sandbox-*"] },
          { Name: "instance-state-name", Values: states },
        ],
        ...(nextToken && { NextToken: nextToken }),
      }),
    );
    for (const r of res.Reservations || []) {
      for (const i of r.Instances || []) {
        instances.push(i);
      }
    }
    nextToken = res.NextToken;
  } while (nextToken);
  return instances;
}

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
