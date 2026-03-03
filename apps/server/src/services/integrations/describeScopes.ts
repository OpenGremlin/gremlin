import { providers } from "./providers.js";

/**
 * Generate a human-readable description from scope labels.
 * Uses the provider's availableScopes to look up labels, then summarizes.
 */
export function describeScopes(
  providerId: string,
  scopes: string[],
): string {
  const provider = providers.find((p) => p.id === providerId);
  if (!provider) return scopes.join(", ");

  const labels = scopes
    .map((s) => provider.availableScopes.find((as) => as.scope === s)?.label)
    .filter(Boolean) as string[];

  if (labels.length === 0) return scopes.join(", ");
  if (labels.length === 1) return labels[0];
  if (labels.length === 2) return `${labels[0]} and ${labels[1]}`;

  return `${labels.slice(0, -1).join(", ")}, and ${labels[labels.length - 1]}`;
}
