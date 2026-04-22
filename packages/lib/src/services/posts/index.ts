import { createPost } from "./createPost.js";
import { deletePost } from "./deletePost.js";
import { getPost } from "./getPost.js";
import { getPostAttachments } from "./getPostAttachments.js";
import { getPosts } from "./getPosts.js";

export type { PostConnectionModel } from "./getPosts.js";

export const postService = {
  createPost,
  deletePost,
  getPost,
  getPostAttachments,
  getPosts,
};

export type PostService = typeof postService;
