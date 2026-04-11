import {
  CloudWatchClient,
  PutMetricDataCommand,
} from "@aws-sdk/client-cloudwatch";

const cw = new CloudWatchClient({});
const tenantId = process.env.TENANT_ID;

/**
 * Publishes an AgentTurns metric to CloudWatch for billing metering.
 * Only publishes when TENANT_ID is set (managed SaaS deployments).
 * Fire-and-forget — errors are logged but never thrown.
 */
export async function publishAgentTurnMetric(agentId: string): Promise<void> {
  if (!tenantId) return;

  try {
    await cw.send(
      new PutMetricDataCommand({
        Namespace: "Gremlin",
        MetricData: [
          {
            MetricName: "AgentTurns",
            Value: 1,
            Unit: "Count",
            Timestamp: new Date(),
            Dimensions: [
              { Name: "TenantId", Value: tenantId },
              { Name: "AgentId", Value: agentId },
            ],
          },
        ],
      }),
    );
  } catch (_) {
    // Silently swallow — billing metrics should never break agent turns
  }
}
