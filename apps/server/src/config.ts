import { GetParameterCommand } from "@aws-sdk/client-ssm";
import { getSsmClient } from "@opengremlin/lib/services/sandbox/ssmClient.js";

const SKIP_AUTH = process.env.SKIP_AUTH === "true";

let cachedServerBaseUrl: string | undefined;

/**
 * Server base URL — used for media and signed file URLs.
 * In prod, resolved from SSM (admin CloudFront URL) since media is served
 * through the same CloudFront. In dev, falls back to localhost.
 */
export async function getServerBaseUrl(): Promise<string> {
  if (cachedServerBaseUrl) return cachedServerBaseUrl;
  if (process.env.SERVER_URL) {
    cachedServerBaseUrl = process.env.SERVER_URL.replace(/\/$/, "");
    return cachedServerBaseUrl;
  }
  if (!SKIP_AUTH) {
    try {
      const ssm = await getSsmClient();
      const res = await ssm.send(
        new GetParameterCommand({ Name: "/gremlin/admin-url" }),
      );
      if (res.Parameter?.Value) {
        cachedServerBaseUrl = res.Parameter.Value.replace(/\/$/, "");
        return cachedServerBaseUrl;
      }
    } catch {
      // SSM not available — fall through
    }
  }
  cachedServerBaseUrl = `http://localhost:${process.env.PORT || 3001}`;
  return cachedServerBaseUrl;
}

/** Load scheduler config from SSM (set by MessagingStack). */
export async function loadSchedulerConfig(): Promise<void> {
  if (process.env.LOCALSTACK_ENDPOINT) return; // local dev — no SSM
  try {
    const ssm = await getSsmClient();
    const params = [
      "/gremlin/schedule-target-queue-arn",
      "/gremlin/scheduler-role-arn",
      "/gremlin/doorbell-queue-url",
    ];
    const envKeys = [
      "SCHEDULE_TARGET_QUEUE_ARN",
      "SCHEDULER_ROLE_ARN",
      "DOORBELL_SQS_URL",
    ];
    await Promise.all(
      params.map(async (name, i) => {
        const res = await ssm.send(new GetParameterCommand({ Name: name }));
        if (res.Parameter?.Value) process.env[envKeys[i]] = res.Parameter.Value;
      }),
    );
  } catch {
    // SSM not available — scheduler features disabled
  }
}
