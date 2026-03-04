import {
  GetSecretValueCommand,
  SecretsManagerClient,
} from "@aws-sdk/client-secrets-manager";

interface OAuthCredentials {
  clientId: string;
  clientSecret: string;
}

const cache = new Map<string, OAuthCredentials>();

export async function getOAuthCredentials(
  secretId: string,
): Promise<OAuthCredentials> {
  const cached = cache.get(secretId);
  if (cached) return cached;

  const sm = new SecretsManagerClient({
    region: process.env.AWS_REGION || "us-east-1",
  });

  const { SecretString } = await sm.send(
    new GetSecretValueCommand({ SecretId: secretId }),
  );

  if (!SecretString) throw new Error(`OAuth secret not found: ${secretId}`);

  const { clientId, clientSecret } = JSON.parse(SecretString) as {
    clientId: string;
    clientSecret: string;
  };

  const creds = { clientId, clientSecret };
  cache.set(secretId, creds);
  return creds;
}
