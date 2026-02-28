import * as path from "node:path";
import { fileURLToPath } from "node:url";
import * as cdk from "aws-cdk-lib";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";
import * as cognito from "aws-cdk-lib/aws-cognito";
import * as iam from "aws-cdk-lib/aws-iam";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as s3deploy from "aws-cdk-lib/aws-s3-deployment";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";
import * as cr from "aws-cdk-lib/custom-resources";
import type { Construct } from "constructs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");

export class AdminStack extends cdk.Stack {
  readonly userPoolId: string;
  readonly userPoolClientId: string;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // ── Cognito ─────────────────────────────────────────────

    const userPool = new cognito.UserPool(this, "AdminUsers", {
      selfSignUpEnabled: false,
      signInAliases: { email: true },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const googleOAuthSecret = secretsmanager.Secret.fromSecretNameV2(
      this,
      "GoogleOAuth",
      "gremlin/google-oauth",
    );

    const googleProvider = new cognito.UserPoolIdentityProviderGoogle(
      this,
      "Google",
      {
        userPool,
        clientId: googleOAuthSecret
          .secretValueFromJson("clientId")
          .unsafeUnwrap(),
        clientSecretValue:
          googleOAuthSecret.secretValueFromJson("clientSecret"),
        scopes: ["email", "openid", "profile"],
        attributeMapping: {
          email: cognito.ProviderAttribute.GOOGLE_EMAIL,
        },
      },
    );

    const userPoolDomain = userPool.addDomain("Domain", {
      cognitoDomain: { domainPrefix: "gremlin-admin" },
    });

    const cognitoDomainName = `${userPoolDomain.domainName}.auth.${this.region}.amazoncognito.com`;

    const userPoolClient = userPool.addClient("AdminApp", {
      supportedIdentityProviders: [
        cognito.UserPoolClientIdentityProvider.GOOGLE,
      ],
      oAuth: {
        flows: { implicitCodeGrant: true },
        scopes: [cognito.OAuthScope.OPENID, cognito.OAuthScope.EMAIL],
        callbackUrls: ["http://localhost:5173"],
      },
    });
    userPoolClient.node.addDependency(googleProvider);

    this.userPoolId = userPool.userPoolId;
    this.userPoolClientId = userPoolClient.userPoolClientId;

    // ── S3 + CloudFront ─────────────────────────────────────

    const adminBucket = new s3.Bucket(this, "AdminBucket", {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
    });

    const distribution = new cloudfront.Distribution(this, "AdminCdn", {
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(adminBucket),
        viewerProtocolPolicy:
          cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
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

    const cfUrl = `https://${distribution.distributionDomainName}`;

    // Patch callback URLs to include CloudFront URL (circular-dep workaround)
    new cr.AwsCustomResource(this, "UpdateCallbackUrls", {
      installLatestAwsSdk: false,
      onUpdate: {
        service: "CognitoIdentityServiceProvider",
        action: "updateUserPoolClient",
        parameters: {
          UserPoolId: userPool.userPoolId,
          ClientId: userPoolClient.userPoolClientId,
          CallbackURLs: [cfUrl, "http://localhost:5173"],
          AllowedOAuthFlows: ["implicit"],
          AllowedOAuthScopes: ["openid", "email"],
          SupportedIdentityProviders: ["Google"],
          AllowedOAuthFlowsUserPoolClient: true,
        },
        physicalResourceId: cr.PhysicalResourceId.of("CallbackUrlUpdate"),
      },
      policy: cr.AwsCustomResourcePolicy.fromStatements([
        new iam.PolicyStatement({
          actions: ["cognito-idp:UpdateUserPoolClient"],
          resources: [userPool.userPoolArn],
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
                "mkdir -p /tmp/build/apps/admin /tmp/build/packages/shared-types",
                "cp /asset-input/pnpm-workspace.yaml /asset-input/pnpm-lock.yaml /asset-input/package.json /asset-input/tsconfig.base.json /tmp/build/",
                "for pkg in apps/admin packages/shared-types; do cp /asset-input/$pkg/package.json /tmp/build/$pkg/; done",
                "cd /tmp/build && pnpm install --frozen-lockfile",
                "cp -r /asset-input/apps/admin/src /asset-input/apps/admin/index.html /asset-input/apps/admin/vite.config.ts /asset-input/apps/admin/tsconfig.json /tmp/build/apps/admin/",
                "cp -r /asset-input/packages/shared-types/src /asset-input/packages/shared-types/tsconfig.json /tmp/build/packages/shared-types/",
                "cd /tmp/build && pnpm --filter @gremlin/shared-types build && pnpm --filter @gremlin/admin build",
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
            cognitoDomain: cognitoDomainName,
            cognitoClientId: userPoolClient.userPoolClientId,
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

    new cdk.CfnOutput(this, "UserPoolId", {
      value: userPool.userPoolId,
    });

    new cdk.CfnOutput(this, "CognitoClientId", {
      value: userPoolClient.userPoolClientId,
    });

    new cdk.CfnOutput(this, "CognitoDomain", {
      value: cognitoDomainName,
    });
  }
}
