/**
 * Helpers for building inline session policies passed to `sts:AssumeRole`.
 *
 * Session policies *intersect* with the role's existing permissions — they
 * can only narrow, never broaden — so applying one is always safe relative
 * to the role itself. The risk is over-restricting and breaking a legitimate
 * call path; see the `NotAction` allowlist below.
 */

/**
 * AWS services whose APIs are global (no regional endpoint, or a single
 * de-facto-global endpoint that pins to us-east-1) and therefore must be
 * excluded from any `aws:RequestedRegion` deny — otherwise the deny would
 * fire on every call regardless of which region the customer chose.
 *
 * This list mirrors the AWS-published reference for region-restriction
 * policies. When adding a new permission to a preset role, check whether the
 * service belongs here; otherwise the region pin will silently break it.
 */
const GLOBAL_SERVICE_NOT_ACTIONS = [
  "iam:*",
  "sts:*",
  "support:*",
  "cloudfront:*",
  "route53:*",
  "route53domains:*",
  "waf:*",
  "wafv2:*",
  "waf-regional:*",
  "shield:*",
  "globalaccelerator:*",
  "organizations:*",
  // AWS Health uses a global endpoint that reports us-east-1 as the
  // RequestedRegion. Without this, every `health:Describe*` call would be
  // denied for any customer who pinned to a non-us-east-1 region — which
  // would break the `troubleshooting` preset entirely.
  "health:*",
  // Billing / cost / account-level services are also global.
  "account:*",
  "artifact:*",
  "ce:*",
  "cur:*",
  "savingsplans:*",
  "tax:*",
  "chatbot:*",
];

/**
 * Build an STS session policy JSON string that locks the resulting
 * credentials to a single region. Pass to `sts:AssumeRole` as the `Policy`
 * parameter.
 *
 * Returns a JSON string (not an object) because the AWS SDK expects the
 * inline session policy in serialized form.
 */
export function buildRegionLockSessionPolicy(region: string): string {
  return JSON.stringify({
    Version: "2012-10-17",
    Statement: [
      {
        Effect: "Deny",
        NotAction: GLOBAL_SERVICE_NOT_ACTIONS,
        Resource: "*",
        Condition: {
          StringNotEquals: { "aws:RequestedRegion": region },
        },
      },
    ],
  });
}
