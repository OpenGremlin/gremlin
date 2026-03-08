import { GetItemCommand } from "dynamodb-toolbox/entity/actions/get";
import type { ProfileItem } from "../../resources/ddb/schema/profile.js";
import type { ServiceContext } from "../context.js";

export async function getProfile(
  ctx: ServiceContext,
  name: string,
): Promise<ProfileItem | null> {
  const { Item } = await ctx.resources.ddb.entities.Profile.build(
    GetItemCommand,
  )
    .key({ name })
    .send();

  return Item ?? null;
}
