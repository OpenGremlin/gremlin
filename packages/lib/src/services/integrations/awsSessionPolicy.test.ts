import { describe, expect, it } from "vitest";
import { buildRegionLockSessionPolicy } from "./awsSessionPolicy.js";

describe("buildRegionLockSessionPolicy", () => {
  it("returns valid JSON", () => {
    const json = buildRegionLockSessionPolicy("eu-west-1");
    expect(() => JSON.parse(json)).not.toThrow();
  });

  it("scopes the deny to a single region via aws:RequestedRegion", () => {
    const policy = JSON.parse(buildRegionLockSessionPolicy("eu-west-1"));
    expect(policy.Statement).toHaveLength(1);
    const stmt = policy.Statement[0];
    expect(stmt.Effect).toBe("Deny");
    expect(stmt.Resource).toBe("*");
    expect(stmt.Condition.StringNotEquals["aws:RequestedRegion"]).toBe(
      "eu-west-1",
    );
  });

  it("excludes global services from the deny via NotAction", () => {
    // These services either have a single global endpoint or don't honor
    // aws:RequestedRegion in a useful way. If any of them are removed from
    // the NotAction list, the corresponding API calls will fail for any
    // region-pinned customer — which is exactly the regression that
    // motivated the original troubleshooting-preset bug fix.
    const requiredGlobalServices = [
      "iam:*",
      "sts:*",
      // health is the load-bearing one — `troubleshooting` uses
      // `health:Describe*`, and AWS Health's global endpoint reports
      // us-east-1 as RequestedRegion. Without this, every Health call
      // would be denied for any non-us-east-1 customer.
      "health:*",
      "support:*",
      "cloudfront:*",
      "route53:*",
      "organizations:*",
    ];

    const policy = JSON.parse(buildRegionLockSessionPolicy("us-west-2"));
    const notAction = policy.Statement[0].NotAction as string[];
    for (const service of requiredGlobalServices) {
      expect(notAction).toContain(service);
    }
  });

  it("matches snapshot (guards against silent regressions)", () => {
    expect(buildRegionLockSessionPolicy("us-east-1")).toMatchSnapshot();
  });

  it("interpolates the region into the condition", () => {
    const usEast = JSON.parse(buildRegionLockSessionPolicy("us-east-1"));
    const apSouth = JSON.parse(buildRegionLockSessionPolicy("ap-south-1"));
    expect(
      usEast.Statement[0].Condition.StringNotEquals["aws:RequestedRegion"],
    ).toBe("us-east-1");
    expect(
      apSouth.Statement[0].Condition.StringNotEquals["aws:RequestedRegion"],
    ).toBe("ap-south-1");
  });
});
