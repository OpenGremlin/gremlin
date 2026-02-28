import * as path from "node:path";
import { fileURLToPath } from "node:url";
import * as cdk from "aws-cdk-lib";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as nodejs from "aws-cdk-lib/aws-lambda-nodejs";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as s3deploy from "aws-cdk-lib/aws-s3-deployment";
import type { Construct } from "constructs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");

export class MediaStack extends cdk.Stack {
  readonly cdnUrl: string;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const bucket = new s3.Bucket(this, "MediaBucket", {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    const handler = new nodejs.NodejsFunction(this, "ResizeHandler", {
      entry: path.join(REPO_ROOT, "apps/media-server/src/index.ts"),
      handler: "handler",
      runtime: lambda.Runtime.NODEJS_20_X,
      architecture: lambda.Architecture.ARM_64,
      memorySize: 1024,
      timeout: cdk.Duration.seconds(30),
      environment: {
        BUCKET_NAME: bucket.bucketName,
      },
      bundling: {
        nodeModules: ["sharp"],
        forceDockerBundling: true,
        commandHooks: {
          beforeBundling: () => [],
          beforeInstall: () => [],
          afterBundling: (inputDir: string, outputDir: string) => [
            `cd ${outputDir} && npm install --cpu=arm64 --os=linux sharp`,
          ],
        },
      },
    });

    new s3deploy.BucketDeployment(this, "DeployAssets", {
      sources: [
        s3deploy.Source.asset(
          path.join(REPO_ROOT, "apps/media-server/assets"),
        ),
      ],
      destinationBucket: bucket,
      memoryLimit: 512,
    });

    bucket.grantRead(handler);

    const fnUrl = handler.addFunctionUrl({
      authType: lambda.FunctionUrlAuthType.NONE,
    });

    const cachePolicy = new cloudfront.CachePolicy(this, "ImageCachePolicy", {
      cachePolicyName: `GremlinMediaCache-${this.stackName}`,
      queryStringBehavior: cloudfront.CacheQueryStringBehavior.allowList(
        "width",
        "height",
        "quality",
        "format",
      ),
      enableAcceptEncodingGzip: true,
      enableAcceptEncodingBrotli: true,
      defaultTtl: cdk.Duration.days(365),
      maxTtl: cdk.Duration.days(365),
    });

    const distribution = new cloudfront.Distribution(this, "CDN", {
      defaultBehavior: {
        origin: new origins.FunctionUrlOrigin(fnUrl),
        viewerProtocolPolicy:
          cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD,
      },
    });

    this.cdnUrl = `https://${distribution.distributionDomainName}`;

    new cdk.CfnOutput(this, "CdnUrl", {
      value: this.cdnUrl,
    });
    new cdk.CfnOutput(this, "BucketName", {
      value: bucket.bucketName,
    });
    new cdk.CfnOutput(this, "FunctionUrl", {
      value: fnUrl.url,
    });
  }
}
