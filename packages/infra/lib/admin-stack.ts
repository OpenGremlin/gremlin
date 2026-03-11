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
          CallbackURLs: [
            cfUrl,
            "http://localhost:5173",
            "http://localhost:19284/cognito-callback",
          ],
          ExplicitAuthFlows: [
            "ALLOW_USER_PASSWORD_AUTH",
            "ALLOW_USER_SRP_AUTH",
            "ALLOW_REFRESH_TOKEN_AUTH",
          ],
          AllowedOAuthFlows: ["implicit", "code"],
          AllowedOAuthScopes: ["openid", "email"],
          SupportedIdentityProviders: ["COGNITO"],
          AllowedOAuthFlowsUserPoolClient: true,
        },
        physicalResourceId: cr.PhysicalResourceId.of("CallbackUrlUpdate-v3"),
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

    // ── Build & deploy mobile web app ───────────────────────

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
                "mkdir -p /tmp/build/apps/mobile /tmp/build/packages/logos",
                "cp /asset-input/pnpm-workspace.yaml /asset-input/pnpm-lock.yaml /asset-input/package.json /asset-input/tsconfig.base.json /tmp/build/",
                "cp /asset-input/apps/mobile/package.json /tmp/build/apps/mobile/",
                "cp /asset-input/packages/logos/package.json /tmp/build/packages/logos/",
                "cd /tmp/build && pnpm install --frozen-lockfile --ignore-scripts",
                "cp -r /asset-input/apps/mobile/src /asset-input/apps/mobile/app /asset-input/apps/mobile/assets /asset-input/apps/mobile/app.json /tmp/build/apps/mobile/",
                "cp -r /asset-input/packages/logos/*.svg /tmp/build/packages/logos/",
                `cd /tmp/build/apps/mobile && EXPO_PUBLIC_COGNITO_DOMAIN=${JSON.stringify(props.cognitoDomain)} EXPO_PUBLIC_COGNITO_CLIENT_ID=${JSON.stringify(props.userPoolClientId)} EXPO_PUBLIC_API_URL="" npx expo export --platform web`,
                "cp -r /tmp/build/apps/mobile/dist/. /asset-output/",
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
      ],
      destinationBucket: adminBucket,
      distribution,
      distributionPaths: ["/*"],
    });

    // ── Outputs ─────────────────────────────────────────────

    new cdk.CfnOutput(this, "AdminUrl", {
      value: cfUrl,
      description: "Web app URL (CloudFront HTTPS)",
    });

    // Store CloudFront URL in SSM so the server can read it at runtime
    new ssm.StringParameter(this, "AdminUrlParam", {
      parameterName: "/gremlin/admin-url",
      stringValue: cfUrl,
    });
  }
}
