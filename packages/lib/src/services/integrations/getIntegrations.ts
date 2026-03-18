import { type IntegrationProviderDef, providers } from "./providers.js";

export function getIntegrations(): IntegrationProviderDef[] {
  return providers.filter((p) => !p.hidden);
}
