import { GetItemCommand } from "dynamodb-toolbox/entity/actions/get";
import type { PostItem } from "../../resources/ddb/schema/post.js";
import type { ServiceContext } from "../context.js";

export async function getPost(
  ctx: ServiceContext,
  id: string,
): Promise<PostItem | null> {
  const { Item } = await ctx.resources.ddb.entities.Post.build(GetItemCommand)
    .key({ id })
    .send();

  if (!Item || Item.deletedAt) return null;
  return Item;
}
