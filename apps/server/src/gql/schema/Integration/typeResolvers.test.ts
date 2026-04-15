import { describe, expect, it } from "vitest";
import { meta } from "./typeResolvers.js";

// meta is a resolver function: (parent, args, ctx) => result
// We only need the parent argument for this pure logic.
const resolve = (parent: unknown) =>
  (meta as Function)(parent, {}, {} as any);

describe("meta resolver", () => {
  it("resolves OAuth connection meta", () => {
    const result = resolve({
      connectionType: "oauth",
      connectionMeta: {
        accountId: "acct-1",
        scopes: "read,write",
        expiresAt: "2025-01-01",
      },
    });
    expect(result).toEqual({
      __typename: "OAuthConnectionMeta",
      accountId: "acct-1",
      scopes: ["read", "write"],
      expiresAt: "2025-01-01",
    });
  });

  it("handles OAuth with missing optional fields", () => {
    const result = resolve({
      connectionType: "oauth",
      connectionMeta: {},
    });
    expect(result).toEqual({
      __typename: "OAuthConnectionMeta",
      accountId: null,
      scopes: [],
      expiresAt: null,
    });
  });

  it("resolves AWS IAM role connection meta", () => {
    const result = resolve({
      connectionType: "aws_iam_role",
      connectionMeta: {
        accountId: "123456",
        roleArn: "arn:aws:iam::role/test",
        roleRegion: "us-east-1",
        displayName: "Test Role",
      },
    });
    expect(result).toEqual({
      __typename: "AwsIamRoleConnectionMeta",
      accountId: "123456",
      roleArn: "arn:aws:iam::role/test",
      region: "us-east-1",
      displayName: "Test Role",
    });
  });

  it("defaults to API key connection meta for unknown types", () => {
    const result = resolve({
      connectionType: "api_key",
      connectionMeta: { accountId: "acct-2" },
    });
    expect(result).toEqual({
      __typename: "ApiKeyConnectionMeta",
      accountId: "acct-2",
    });
  });

  it("defaults to API key meta with null accountId when missing", () => {
    const result = resolve({
      connectionType: "api_key",
      connectionMeta: {},
    });
    expect(result).toEqual({
      __typename: "ApiKeyConnectionMeta",
      accountId: null,
    });
  });
});
