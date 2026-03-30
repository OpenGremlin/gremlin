import * as path from "node:path";
import { fileURLToPath } from "node:url";
import * as cdk from "aws-cdk-lib";
import * as acm from "aws-cdk-lib/aws-certificatemanager";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";
import * as iam from "aws-cdk-lib/aws-iam";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as lambda_nodejs from "aws-cdk-lib/aws-lambda-nodejs";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as s3deploy from "aws-cdk-lib/aws-s3-deployment";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";
import * as ssm from "aws-cdk-lib/aws-ssm";
import * as cr from "aws-cdk-lib/custom-resources";
import type { Construct } from "constructs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");

export interface AdminStackProps extends cdk.StackProps {
  userPoolId: string;
  userPoolClientId: string;
  cognitoDomain: string;
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

    // Shared secret so the origin can reject requests that bypass CloudFront.
    // Generated once by Secrets Manager; stored in SSM for the server to read.
    // To rotate: update the secret in Secrets Manager and redeploy.
    const originVerifySecret = new secretsmanager.Secret(
      this,
      "OriginVerifySecret",
      {
        description: "Shared secret between CloudFront and origin server",
        generateSecretString: {
          excludePunctuation: true,
          passwordLength: 48,
        },
      },
    );

    new ssm.StringParameter(this, "OriginVerifyParam", {
      parameterName: "/gremlin/origin-verify-secret",
      stringValue: originVerifySecret.secretValue.unsafeUnwrap(),
      description: "CloudFront → origin shared secret for X-Origin-Verify",
    });

    // ALB origin for API/auth/GraphQL traffic
    const serverOrigin = new origins.HttpOrigin(props.serverDns, {
      protocolPolicy: cloudfront.OriginProtocolPolicy.HTTP_ONLY,
      httpPort: 3001,
    });

    // Origin for file serving — includes the shared verification header
    const filesOrigin = new origins.HttpOrigin(props.serverDns, {
      protocolPolicy: cloudfront.OriginProtocolPolicy.HTTP_ONLY,
      httpPort: 3001,
      customHeaders: {
        "x-origin-verify": originVerifySecret.secretValue.unsafeUnwrap(),
      },
    });

    // Lambda@Edge: validate Cognito JWT on workspace file requests.
    // Config is stored in SSM because Lambda@Edge doesn't support env vars,
    // and CDK cross-stack tokens can't be baked in via esbuild define.
    const cognitoIssuer = `https://cognito-idp.${cdk.Stack.of(this).region}.amazonaws.com/${props.userPoolId}`;

    new ssm.StringParameter(this, "CognitoIssuerParam", {
      parameterName: "/gremlin/cognito-issuer",
      stringValue: cognitoIssuer,
    });

    new ssm.StringParameter(this, "CognitoClientIdParam", {
      parameterName: "/gremlin/cognito-client-id",
      stringValue: props.userPoolClientId,
    });

    const filesAuthFn = new lambda_nodejs.NodejsFunction(
      this,
      "FilesAuthEdgeFn",
      {
        entry: path.join(
          REPO_ROOT,
          "packages/functions/src/files-auth/index.ts",
        ),
        handler: "handler",
        runtime: lambda.Runtime.NODEJS_20_X,
        timeout: cdk.Duration.seconds(5),
        bundling: {
          format: lambda_nodejs.OutputFormat.ESM,
          mainFields: ["module", "main"],
        },
      },
    );

    filesAuthFn.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ["ssm:GetParameter"],
        resources: [
          `arn:aws:ssm:${this.region}:${this.account}:parameter/gremlin/cognito-*`,
        ],
      }),
    );

    // ── Optional custom domain ──────────────────────────────
    // The CLI writes /gremlin/custom-domain to SSM before deploying.
    // If set, we add the domain as a CloudFront alias with an ACM cert.
    // ACM certs for CloudFront must be in us-east-1 — CDK handles
    // cross-region references automatically.
    const customDomain = ssm.StringParameter.valueFromLookup(
      this,
      "/gremlin/custom-domain",
    );
    // valueFromLookup returns a dummy token during first synth if the
    // param doesn't exist. Check for real values only.
    const hasCustomDomain =
      customDomain &&
      !customDomain.startsWith("dummy-value") &&
      customDomain !== "NOT_SET";

    let certificate: acm.ICertificate | undefined;
    if (hasCustomDomain) {
      certificate = new acm.Certificate(this, "CustomDomainCert", {
        domainName: customDomain,
        validation: acm.CertificateValidation.fromDns(),
      });
    }

    const apiBehavior: cloudfront.BehaviorOptions = {
      origin: serverOrigin,
      viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
      cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
      originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER,
    };

    const distribution = new cloudfront.Distribution(this, "AdminCdn", {
      domainNames: hasCustomDomain ? [customDomain] : undefined,
      certificate,
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(adminBucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
      },
      additionalBehaviors: {
        "/graphql": apiBehavior,
        "/api/files/*": {
          origin: filesOrigin,
          viewerProtocolPolicy:
            cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD,
          cachePolicy: new cloudfront.CachePolicy(this, "FilesCachePolicy", {
            cachePolicyName: `GremlinFilesCache-${this.stackName}`,
            queryStringBehavior:
              cloudfront.CacheQueryStringBehavior.allowList("width"),
            defaultTtl: cdk.Duration.days(365),
            maxTtl: cdk.Duration.days(365),
          }),
          edgeLambdas: [
            {
              eventType: cloudfront.LambdaEdgeEventType.VIEWER_REQUEST,
              functionVersion: filesAuthFn.currentVersion,
            },
          ],
        },
        "/api/*": apiBehavior,
        "/media/*": {
          origin: serverOrigin,
          viewerProtocolPolicy:
            cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD,
          cachePolicy: new cloudfront.CachePolicy(this, "MediaCachePolicy", {
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
          }),
        },
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
            ...(hasCustomDomain ? [`https://${customDomain}`] : []),
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
              "/asset-input/apps/mobile/scripts/build-web.sh",
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
      destinationBucket: adminBucket,
      distribution,
      distributionPaths: ["/*"],
    });

    // ── Outputs ─────────────────────────────────────────────

    new cdk.CfnOutput(this, "AdminUrl", {
      value: cfUrl,
      description: "Web app URL (CloudFront HTTPS)",
    });

    // Store the canonical URL in SSM — custom domain if set, else CloudFront
    const canonicalUrl = hasCustomDomain ? `https://${customDomain}` : cfUrl;

    new ssm.StringParameter(this, "AdminUrlParam", {
      parameterName: "/gremlin/admin-url",
      stringValue: canonicalUrl,
    });

    if (hasCustomDomain) {
      new cdk.CfnOutput(this, "CustomDomain", {
        value: customDomain,
        description: "Custom domain name",
      });

      new cdk.CfnOutput(this, "CloudFrontDomain", {
        value: distribution.distributionDomainName,
        description: "CloudFront domain — point your CNAME here",
      });
    }
  }
}
