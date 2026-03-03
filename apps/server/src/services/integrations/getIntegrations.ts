import { providers, type ProviderDef } from "./providers.js";

export function getIntegrations(): ProviderDef[] {
  return providers;
}
