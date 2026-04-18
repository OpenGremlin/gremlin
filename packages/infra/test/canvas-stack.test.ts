import * as cdk from "aws-cdk-lib";
import { Match, Template } from "aws-cdk-lib/assertions";
import { describe, it } from "vitest";
import { CanvasStack } from "../lib/canvas-stack.js";

function synth() {
  // Empty bundling-stacks list skips Docker-based asset bundling so the
  // test doesn't need Docker and doesn't time out.
  const app = new cdk.App({
    context: { "aws:cdk:bundling-stacks": [] },
  });
  const stack = new CanvasStack(app, "TestCanvasStack", {
    env: { account: "111111111111", region: "us-east-1" },
  });
  return Template.fromStack(stack);
}

describe("CanvasStack", () => {
  it("locks the bucket down from public access", () => {
    const template = synth();
    template.hasResourceProperties("AWS::S3::Bucket", {
      PublicAccessBlockConfiguration: {
        BlockPublicAcls: true,
        BlockPublicPolicy: true,
        IgnorePublicAcls: true,
        RestrictPublicBuckets: true,
      },
    });
  });

  it("serves the bucket via CloudFront with OAC and SPA fallbacks", () => {
    const template = synth();
    template.resourceCountIs("AWS::CloudFront::OriginAccessControl", 1);
    template.hasResourceProperties("AWS::CloudFront::Distribution", {
      DistributionConfig: Match.objectLike({
        DefaultRootObject: "index.html",
        CustomErrorResponses: Match.arrayWith([
          Match.objectLike({
            ErrorCode: 403,
            ResponseCode: 200,
            ResponsePagePath: "/index.html",
          }),
          Match.objectLike({
            ErrorCode: 404,
            ResponseCode: 200,
            ResponsePagePath: "/index.html",
          }),
        ]),
      }),
    });
  });

  it("publishes the receiver URL to SSM so other stacks can find it", () => {
    const template = synth();
    template.hasResourceProperties("AWS::SSM::Parameter", {
      Name: "/gremlin/canvas-url",
    });
  });
});
