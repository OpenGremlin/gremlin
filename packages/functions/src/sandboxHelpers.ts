import { DescribeInstancesCommand, EC2Client } from "@aws-sdk/client-ec2";

export const ec2 = new EC2Client({});

export interface SandboxInstance {
  InstanceId?: string;
  LaunchTime?: Date;
  Tags?: Array<{ Key?: string; Value?: string }>;
}

export function getTag(
  instance: SandboxInstance,
  key: string,
): string | undefined {
  return instance.Tags?.find((t) => t.Key === key)?.Value;
}

export async function describeSandboxInstances(
  states: string[],
): Promise<SandboxInstance[]> {
  const instances: SandboxInstance[] = [];
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
