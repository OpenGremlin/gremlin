import type { ServiceContext } from "../context.js";
import { getGoogleOAuthClient } from "./getGoogleOAuthClient.js";

const SCOPES = [
  "openid",
  "email",
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/documents.readonly",
];

export async function generateGoogleAuthUrl(
  ctx: ServiceContext,
): Promise<string> {
  const client = await getGoogleOAuthClient();

  const url = client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: SCOPES,
    state: ctx.user?.sub,
  });

  return url;
}
