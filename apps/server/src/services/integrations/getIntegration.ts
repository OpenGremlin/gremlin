import { providers, type IntegrationProviderDef } from "./providers.js";

export function getIntegration(id: string): IntegrationProviderDef | null {
  return providers.find((p) => p.id === id) ?? null;
}
