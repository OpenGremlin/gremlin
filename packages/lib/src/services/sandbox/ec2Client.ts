import type { EC2Client } from "@aws-sdk/client-ec2";

let _ec2: EC2Client | undefined;
export async function getEc2Client() {
  if (!_ec2) {
    const { EC2Client } = await import("@aws-sdk/client-ec2");
    _ec2 = new EC2Client({});
  }
  return _ec2;
}
