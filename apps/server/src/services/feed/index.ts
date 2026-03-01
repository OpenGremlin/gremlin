import { getFeedItem } from "./getFeedItem.js";
import { getFeedItems } from "./getFeedItems.js";

export const feedService = { getFeedItems, getFeedItem };

export type FeedService = typeof feedService;
