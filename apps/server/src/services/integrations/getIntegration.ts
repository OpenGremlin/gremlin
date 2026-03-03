import { providers, type ProviderDef } from "./providers.js";

export function getIntegration(id: string): ProviderDef | null {
  return providers.find((p) => p.id === id) ?? null;
}
