#!/usr/bin/env node
/**
 * Called after the sandbox relay is healthy.
 * Assumes the notify hook IAM role and calls the server's /notifyHook
 * endpoint to signal that the sandbox is ready.
 */
import { AssumeRoleCommand, STSClient } from "@aws-sdk/client-sts";

const {
  NOTIFY_HOOK_ROLE_ARN,
  NOTIFY_HOOK_URL,
  INSTANCE_ID,
  AGENT_ID,
  AWS_REGION,
} = process.env;

if (!NOTIFY_HOOK_URL || !AGENT_ID) {
  console.log(
    "notify-server: NOTIFY_HOOK_URL or AGENT_ID not set, skipping notification",
  );
  process.exit(0);
}

if (!NOTIFY_HOOK_ROLE_ARN) {
  console.log("notify-server: NOTIFY_HOOK_ROLE_ARN not set, skipping");
  process.exit(0);
}

try {
  // Assume the notify hook role
  const sts = new STSClient({ region: AWS_REGION || "us-east-1" });
  const assumed = await sts.send(
    new AssumeRoleCommand({
      RoleArn: NOTIFY_HOOK_ROLE_ARN,
      RoleSessionName: `sandbox-${INSTANCE_ID || "unknown"}`,
      DurationSeconds: 900,
    }),
  );

  const creds = assumed.Credentials;
  if (!creds?.AccessKeyId || !creds?.SecretAccessKey || !creds?.SessionToken) {
    throw new Error("Failed to get assumed role credentials");
  }

  // Call the server's notifyHook endpoint
  const res = await fetch(NOTIFY_HOOK_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-aws-access-key-id": creds.AccessKeyId,
      "x-aws-secret-access-key": creds.SecretAccessKey,
      "x-aws-session-token": creds.SessionToken,
    },
    body: JSON.stringify({
      type: "sandbox_available",
      agentId: AGENT_ID,
      payload: {
        instanceId: INSTANCE_ID || "unknown",
      },
    }),
    signal: AbortSignal.timeout(10_000),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Server returned ${res.status}: ${body}`);
  }

  console.log("notify-server: Successfully notified server sandbox is ready");
} catch (err) {
  console.error("notify-server: Failed to notify server:", err.message);
  process.exit(1);
}
