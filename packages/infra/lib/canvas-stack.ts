import * as path from "node:path";
import { fileURLToPath } from "node:url";
import * as cdk from "aws-cdk-lib";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as s3deploy from "aws-cdk-lib/aws-s3-deployment";
import * as ssm from "aws-cdk-lib/aws-ssm";
import type { Construct } from "constructs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");

export class CanvasStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: cdk.StackProps) {
    super(scope, id, props);

    const canvasBucket = new s3.Bucket(this, "CanvasBucket", {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
    });

    const distribution = new cloudfront.Distribution(this, "CanvasCdn", {
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(canvasBucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
      },
      defaultRootObject: "index.html",
      errorResponses: [
        {
          httpStatus: 403,
          responsePagePath: "/index.html",
          responseHttpStatus: 200,
        },
        {
          httpStatus: 404,
          responsePagePath: "/index.html",
          responseHttpStatus: 200,
        },
      ],
    });

    new s3deploy.BucketDeployment(this, "CanvasDeploy", {
      sources: [
        s3deploy.Source.asset(REPO_ROOT, {
          bundling: {
            image: cdk.DockerImage.fromRegistry("node:20-slim"),
            command: [
              "bash",
              "/asset-input/apps/canvas/scripts/build-web.sh",
              "/asset-input",
              "/asset-output",
            ],
            user: "root",
          },
          exclude: [
            "**/node_modules",
            "**/cdk.out",
            "**/dist",
            "**/.git",
            "reference",
          ],
        }),
      ],
      destinationBucket: canvasBucket,
      distribution,
      distributionPaths: ["/*"],
    });

    const canvasUrl = `https://${distribution.distributionDomainName}`;

    new cdk.CfnOutput(this, "CanvasUrl", {
      value: canvasUrl,
      description: "Canvas receiver URL (CloudFront HTTPS)",
    });

    new ssm.StringParameter(this, "CanvasUrlParam", {
      parameterName: "/gremlin/canvas-url",
      stringValue: canvasUrl,
    });
  }
}
