import { GetItemCommand } from "dynamodb-toolbox/entity/actions/get";
import { PutItemCommand } from "dynamodb-toolbox/entity/actions/put";
import type { MutationResolvers, QueryResolvers } from "../../resolverTypes.js";

interface GlobalSettingsData {
  signupDisabled: boolean;
}

const DEFAULTS: GlobalSettingsData = {
  signupDisabled: false,
};

const globalSettings: QueryResolvers["globalSettings"] = async (
  _parent,
  _args,
  ctx,
) => {
  const { Item } = await ctx.resources.ddb.entities.GlobalSettings.build(
    GetItemCommand,
  )
    .key({ id: "global" })
    .send();

  if (Item) return { signupDisabled: Item.signupDisabled };

  // Fallback: read from legacy Setting and lazy-migrate
  const { Item: legacy } = await ctx.resources.ddb.entities.Setting.build(
    GetItemCommand,
  )
    .key({ key: "globalSettings" })
    .send();

  if (legacy) {
    const parsed = { ...DEFAULTS, ...JSON.parse(legacy.value) };
    await ctx.resources.ddb.entities.GlobalSettings.build(PutItemCommand)
      .item({ id: "global", signupDisabled: parsed.signupDisabled })
      .send();
    return parsed;
  }

  return { ...DEFAULTS };
};

const updateGlobalSettings: MutationResolvers["updateGlobalSettings"] = async (
  _parent,
  args,
  ctx,
) => {
  const { Item } = await ctx.resources.ddb.entities.GlobalSettings.build(
    GetItemCommand,
  )
    .key({ id: "global" })
    .send();

  const current: GlobalSettingsData = Item
    ? { signupDisabled: Item.signupDisabled }
    : { ...DEFAULTS };

  if (args.signupDisabled != null) {
    current.signupDisabled = args.signupDisabled;
  }

  await ctx.resources.ddb.entities.GlobalSettings.build(PutItemCommand)
    .item({ id: "global", ...current })
    .send();

  return current;
};

export const settingsResolvers = {
  Query: { globalSettings },
  Mutation: { updateGlobalSettings },
};
