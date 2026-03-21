import { QueryCommand } from "dynamodb-toolbox/table/actions/query";
import type { CommandApprovalItem } from "../../resources/ddb/schema/commandApproval.js";
import type { ServiceContext } from "../context.js";

export async function getCommandApproval(
  ctx: ServiceContext,
  id: string,
): Promise<CommandApprovalItem | null> {
  const { Items } = await ctx.resources.ddb.table
    .build(QueryCommand)
    .entities(ctx.resources.ddb.entities.CommandApproval)
    .query({
      partition: "COMMAND_APPROVAL",
      range: { eq: `COMMAND_APPROVAL#${id}` },
    })
    .send();

  return Items?.[0] ?? null;
}
