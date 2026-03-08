import { PutItemCommand } from "dynamodb-toolbox/entity/actions/put";
import type { ProfileItem } from "../../resources/ddb/schema/profile.js";
import type { ServiceContext } from "../context.js";

export async function updateProfile(
  ctx: ServiceContext,
  input: {
    name: string;
    displayName: string;
    about: string;
    website?: string | null;
    timezone?: string | null;
  },
): Promise<ProfileItem> {
  const item = {
    name: input.name,
    displayName: input.displayName,
    about: input.about,
    website: input.website ?? null,
    timezone: input.timezone ?? null,
  };

  await ctx.resources.ddb.entities.Profile.build(PutItemCommand)
    .item(item)
    .send();

  return item;
}
