import * as path from "node:path";
import { fileURLToPath } from "node:url";
import * as cdk from "aws-cdk-lib";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";
import * as iam from "aws-cdk-lib/aws-iam";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as s3deploy from "aws-cdk-lib/aws-s3-deployment";
import * as ssm from "aws-cdk-lib/aws-ssm";
import * as cr from "aws-cdk-lib/custom-resources";
import type { Construct } from "constructs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");

export interface AdminStackProps extends cdk.StackProps {
  userPoolId: string;
  userPoolClientId: string;
  cognitoDomain: string;
  mediaCdnUrl: string;
  serverDns: string;
}

export class AdminStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: AdminStackProps) {
    super(scope, id, props);

    // ── S3 + CloudFront ─────────────────────────────────────

    const adminBucket = new s3.Bucket(this, "AdminBucket", {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
    });

    // ALB origin for API/auth/GraphQL traffic
    const serverOrigin = new origins.HttpOrigin(props.serverDns, {
      protocolPolicy: cloudfront.OriginProtocolPolicy.HTTP_ONLY,
      httpPort: 3001,
    });

    const apiBehavior: cloudfront.BehaviorOptions = {
      origin: serverOrigin,
      viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
      cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
      originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER,
    };

    const distribution = new cloudfront.Distribution(this, "AdminCdn", {
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(adminBucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
      },
      additionalBehaviors: {
        "/graphql": apiBehavior,
        "/api/*": apiBehavior,
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

    const cfUrl = `https://${distribution.distributionDomainName}`;

    // Patch callback URLs to include CloudFront URL
    new cr.AwsCustomResource(this, "UpdateCallbackUrls", {
      installLatestAwsSdk: false,
      onUpdate: {
        service: "CognitoIdentityServiceProvider",
        action: "updateUserPoolClient",
        parameters: {
          UserPoolId: props.userPoolId,
          ClientId: props.userPoolClientId,
          CallbackURLs: [cfUrl, "http://localhost:5173"],
          AllowedOAuthFlows: ["implicit"],
          AllowedOAuthScopes: ["openid", "email"],
          SupportedIdentityProviders: ["COGNITO"],
          AllowedOAuthFlowsUserPoolClient: true,
        },
        physicalResourceId: cr.PhysicalResourceId.of("CallbackUrlUpdate"),
      },
      policy: cr.AwsCustomResourcePolicy.fromStatements([
        new iam.PolicyStatement({
          actions: ["cognito-idp:UpdateUserPoolClient"],
          resources: [
            cdk.Arn.format(
              {
                service: "cognito-idp",
                resource: "userpool",
                resourceName: props.userPoolId,
              },
              this,
            ),
          ],
        }),
      ]),
    });

    // ── Deploy admin SPA + runtime config ───────────────────

    new s3deploy.BucketDeployment(this, "AdminDeploy", {
      sources: [
        s3deploy.Source.asset(REPO_ROOT, {
          bundling: {
            image: cdk.DockerImage.fromRegistry("node:20-slim"),
            command: [
              "bash",
              "-c",
              [
                "corepack enable",
                "mkdir -p /tmp/build/apps/admin",
                "cp /asset-input/pnpm-workspace.yaml /asset-input/pnpm-lock.yaml /asset-input/package.json /asset-input/tsconfig.base.json /tmp/build/",
                "cp /asset-input/apps/admin/package.json /tmp/build/apps/admin/",
                "cd /tmp/build && pnpm install --frozen-lockfile --ignore-scripts",
                "cp -r /asset-input/apps/admin/src /asset-input/apps/admin/public /asset-input/apps/admin/index.html /asset-input/apps/admin/vite.config.ts /asset-input/apps/admin/tsconfig.json /tmp/build/apps/admin/",
                "cd /tmp/build && pnpm --filter @gremlin/admin build",
                "cp -r /tmp/build/apps/admin/dist/. /asset-output/",
              ].join(" && "),
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
        s3deploy.Source.data(
          "config.js",
          `window.__GREMLIN_CONFIG__ = ${JSON.stringify({
            cognitoDomain: props.cognitoDomain,
            cognitoClientId: props.userPoolClientId,
            mediaCdnUrl: props.mediaCdnUrl,
          })};`,
        ),
      ],
      destinationBucket: adminBucket,
      distribution,
      distributionPaths: ["/*"],
    });

    // ── Outputs ─────────────────────────────────────────────

    new cdk.CfnOutput(this, "AdminUrl", {
      value: cfUrl,
      description: "Admin dashboard URL (CloudFront HTTPS)",
    });

    // Store CloudFront URL in SSM so the server can read it at runtime
    new ssm.StringParameter(this, "AdminUrlParam", {
      parameterName: "/gremlin/admin-url",
      stringValue: cfUrl,
    });
  }
}
