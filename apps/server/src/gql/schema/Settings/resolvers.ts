import { GetItemCommand } from "dynamodb-toolbox/entity/actions/get";
import { PutItemCommand } from "dynamodb-toolbox/entity/actions/put";
import type { MutationResolvers, QueryResolvers } from "../../resolverTypes.js";

const SETTINGS_KEY = "globalSettings";

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
  const { Item } = await ctx.resources.ddb.entities.Setting.build(
    GetItemCommand,
  )
    .key({ key: SETTINGS_KEY })
    .send();

  if (!Item) return { ...DEFAULTS };
  return { ...DEFAULTS, ...JSON.parse(Item.value) };
};

const updateGlobalSettings: MutationResolvers["updateGlobalSettings"] = async (
  _parent,
  args,
  ctx,
) => {
  const { Item } = await ctx.resources.ddb.entities.Setting.build(
    GetItemCommand,
  )
    .key({ key: SETTINGS_KEY })
    .send();

  const current: GlobalSettingsData = Item
    ? { ...DEFAULTS, ...JSON.parse(Item.value) }
    : { ...DEFAULTS };

  if (args.signupDisabled != null) {
    current.signupDisabled = args.signupDisabled;
  }

  await ctx.resources.ddb.entities.Setting.build(PutItemCommand)
    .item({ key: SETTINGS_KEY, value: JSON.stringify(current) })
    .send();

  return current;
};

export const settingsResolvers = {
  Query: { globalSettings },
  Mutation: { updateGlobalSettings },
};
