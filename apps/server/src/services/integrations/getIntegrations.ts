import { providers, type IntegrationProviderDef } from "./providers.js";

export function getIntegrations(): IntegrationProviderDef[] {
  return providers;
}
