import { DeleteItemCommand } from "dynamodb-toolbox/entity/actions/delete";
import type { ServiceContext } from "../context.js";
import { providers } from "./providers.js";

export async function disconnectIntegration(
  ctx: ServiceContext,
  id: string,
): Promise<boolean> {
  const provider = providers.find((p) => p.id === id);
  if (!provider) throw new Error(`Unknown provider: ${id}`);

  const userId = ctx.user?.sub;
  if (!userId) throw new Error("Not authenticated");

  await ctx.resources.ddb.entities.OAuthToken.build(DeleteItemCommand)
    .key({ userId, provider: provider.id })
    .send();

  return true;
}
