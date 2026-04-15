import { createPost } from "./createPost.js";
import { getPostAttachments } from "./getPostAttachments.js";
import { getPosts } from "./getPosts.js";

export type { PostConnectionModel } from "./getPosts.js";

export const postService = {
  createPost,
  getPostAttachments,
  getPosts,
};

export type PostService = typeof postService;
