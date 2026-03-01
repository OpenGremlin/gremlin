import {
  FeedCategory,
  type FeedItemResolvers,
  type QueryResolvers,
} from "../../resolverTypes.js";
import { findAgent } from "../Agent/resolvers.js";

export interface FeedItemModel {
  id: string;
  agentId: string;
  title: string;
  summary: string;
  body: string;
  category: FeedCategory;
  completedAt: string;
}

const mockFeedItems: FeedItemModel[] = [
  {
    id: "1",
    agentId: "clawd",
    title: "Morning news digest",
    summary: "Compiled top stories from 12 sources",
    body: "## Headlines\n- Tech earnings beat expectations\n- New climate report released",
    category: FeedCategory.Research,
    completedAt: "2026-02-28T08:00:00Z",
  },
  {
    id: "2",
    agentId: "moss",
    title: "Weekly backup complete",
    summary: "All documents synced to cloud storage",
    body: "Backed up 342 files across 5 directories.",
    category: FeedCategory.Task,
    completedAt: "2026-02-27T22:00:00Z",
  },
  {
    id: "3",
    agentId: "nyx",
    title: "Uptime check passed",
    summary: "All monitored services healthy",
    body: "Response times within normal range. No anomalies detected.",
    category: FeedCategory.Monitor,
    completedAt: "2026-02-28T06:30:00Z",
  },
];

const feedItems: QueryResolvers["feedItems"] = () => mockFeedItems;

const feedItem: QueryResolvers["feedItem"] = (_parent, { id }) =>
  mockFeedItems.find((item) => item.id === id) ?? null;

const agent: FeedItemResolvers["agent"] = (parent) => {
  const a = findAgent(parent.agentId);
  if (!a) throw new Error(`Agent ${parent.agentId} not found`);
  return a;
};

export const feedResolvers = {
  Query: { feedItems, feedItem },
  FeedItem: { agent },
};
