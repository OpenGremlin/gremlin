import { UpdateItemCommand } from "dynamodb-toolbox/entity/actions/update";
import type { PostItem } from "../../resources/ddb/schema/post.js";
import type { ServiceContext } from "../context.js";
import { getPost } from "./getPost.js";

export async function deletePost(
  ctx: ServiceContext,
  id: string,
): Promise<PostItem | null> {
  const existing = await getPost(ctx, id);
  if (!existing) return null;
  if (existing.deletedAt) return existing;

  const deletedAt = new Date().toISOString();
  await ctx.resources.ddb.entities.Post.build(UpdateItemCommand)
    .item({ id, deletedAt })
    .send();

  return { ...existing, deletedAt };
}
