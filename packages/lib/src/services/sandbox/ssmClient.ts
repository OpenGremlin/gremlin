import type { SSMClient } from "@aws-sdk/client-ssm";

let _ssm: SSMClient | undefined;
export async function getSsmClient() {
  if (!_ssm) {
    const { SSMClient } = await import("@aws-sdk/client-ssm");
    _ssm = new SSMClient({});
  }
  return _ssm;
}
