import { GetItemCommand } from "dynamodb-toolbox/entity/actions/get";
import { PutItemCommand } from "dynamodb-toolbox/entity/actions/put";
import type { MutationResolvers, QueryResolvers } from "../../resolverTypes.js";

const DEFAULTS = { signupDisabled: false };

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

  return Item ? { signupDisabled: Item.signupDisabled } : { ...DEFAULTS };
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

  const current: { signupDisabled: boolean } = Item
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
