import type { FeedItem, QueryResolvers } from "../../resolverTypes.js";

const mockFeedItems: FeedItem[] = [
  {
    id: "1",
    agentName: "Scout",
    avatarState: "active",
    title: "Morning news digest",
    summary: "Compiled top stories from 12 sources",
    body: "## Headlines\n- Tech earnings beat expectations\n- New climate report released",
    category: "RESEARCH",
    completedAt: "2026-02-28T08:00:00Z",
  },
  {
    id: "2",
    agentName: "Archivist",
    avatarState: "dormant",
    title: "Weekly backup complete",
    summary: "All documents synced to cloud storage",
    body: "Backed up 342 files across 5 directories.",
    category: "TASK",
    completedAt: "2026-02-27T22:00:00Z",
  },
  {
    id: "3",
    agentName: "Sentinel",
    avatarState: "attentive",
    title: "Uptime check passed",
    summary: "All monitored services healthy",
    body: "Response times within normal range. No anomalies detected.",
    category: "MONITOR",
    completedAt: "2026-02-28T06:30:00Z",
  },
];

const feedItems: QueryResolvers["feedItems"] = () => mockFeedItems;

const feedItem: QueryResolvers["feedItem"] = (_parent, { id }) =>
  mockFeedItems.find((item) => item.id === id) ?? null;

export const feedResolvers = {
  Query: { feedItems, feedItem },
};
