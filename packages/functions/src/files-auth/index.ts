import { GetParameterCommand, SSMClient } from "@aws-sdk/client-ssm";
import type {
  CloudFrontRequestEvent,
  CloudFrontRequestResult,
} from "aws-lambda";
import * as jose from "jose";

// Lambda@Edge does not support environment variables. Config is loaded
// from SSM on the first invocation and cached for the container lifetime.
// SSM params live in us-east-1 (same region as the CDK stacks).
const ssm = new SSMClient({ region: "us-east-1" });

let cognitoIssuer: string;
let cognitoClientId: string;
let jwks: ReturnType<typeof jose.createRemoteJWKSet>;

async function loadConfig() {
  if (cognitoIssuer) return;

  const [issuerRes, clientIdRes] = await Promise.all([
    ssm.send(new GetParameterCommand({ Name: "/gremlin/cognito-issuer" })),
    ssm.send(new GetParameterCommand({ Name: "/gremlin/cognito-client-id" })),
  ]);

  const issuer = issuerRes.Parameter?.Value;
  const clientId = clientIdRes.Parameter?.Value;
  if (!issuer || !clientId) {
    throw new Error("Missing SSM parameters for Cognito config");
  }
  cognitoIssuer = issuer;
  cognitoClientId = clientId;
  jwks = jose.createRemoteJWKSet(
    new URL(`${cognitoIssuer}/.well-known/jwks.json`),
  );
}

function deny(status: string, body: string): CloudFrontRequestResult {
  return {
    status,
    statusDescription: status === "401" ? "Unauthorized" : "Forbidden",
    body,
  };
}

export async function handler(
  event: CloudFrontRequestEvent,
): Promise<CloudFrontRequestResult> {
  const request = event.Records[0].cf.request;
  const authHeader = request.headers.authorization?.[0]?.value;

  if (!authHeader?.startsWith("Bearer ")) {
    return deny("401", "Missing or invalid Authorization header");
  }

  const token = authHeader.slice(7);

  try {
    await loadConfig();
  } catch {
    return deny("503", "Service temporarily unavailable");
  }

  try {
    const { payload } = await jose.jwtVerify(token, jwks, {
      issuer: cognitoIssuer,
      audience: cognitoClientId,
    });

    const groups = (payload["cognito:groups"] as string[] | undefined) ?? [];
    if (!groups.includes("admins")) {
      return deny("403", "Insufficient permissions");
    }
  } catch {
    return deny("401", "Invalid or expired token");
  }

  // Strip Authorization header so it does not enter the CloudFront cache key.
  delete request.headers.authorization;
  return request;
}
