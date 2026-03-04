import type { Resources } from "../../resources/index.js";
import { handleOAuthCallback } from "../oauth/handleCallback.js";

export async function handleGoogleCallback(
  resources: Resources,
  code: string,
  stateRaw: string,
): Promise<void> {
  await handleOAuthCallback(resources, code, stateRaw);
}
