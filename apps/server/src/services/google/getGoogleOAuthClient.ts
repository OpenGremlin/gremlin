import {
  GetSecretValueCommand,
  SecretsManagerClient,
} from "@aws-sdk/client-secrets-manager";
import { OAuth2Client } from "google-auth-library";

let cachedClient: OAuth2Client | null = null;

export async function getGoogleOAuthClient(): Promise<OAuth2Client> {
  if (cachedClient) return cachedClient;

  const sm = new SecretsManagerClient({
    region: process.env.AWS_REGION || "us-east-1",
  });

  const { SecretString } = await sm.send(
    new GetSecretValueCommand({ SecretId: "gremlin/google-oauth" }),
  );

  if (!SecretString) throw new Error("Google OAuth secret not found");

  const { clientId, clientSecret } = JSON.parse(SecretString) as {
    clientId: string;
    clientSecret: string;
  };

  const redirectUri =
    process.env.GOOGLE_OAUTH_REDIRECT_URI ||
    "http://localhost:3001/auth/google/callback";

  cachedClient = new OAuth2Client(clientId, clientSecret, redirectUri);
  return cachedClient;
}
