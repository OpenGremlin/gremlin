import {
  FeedCategory,
  type FeedItemResolvers,
  type QueryResolvers,
} from "../../resolverTypes.js";

export interface FeedItemModel {
  id: string;
  agentName: string;
  avatarState: string;
  portraitId: string;
  avatar: string;
  title: string;
  summary: string;
  body: string;
  category: FeedCategory;
  completedAt: string;
}

const mockFeedItems: FeedItemModel[] = [
  {
    id: "1",
    agentName: "Scout",
    avatarState: "active",
    portraitId: "avatar:preset:Kai",
    avatar: "/avatars/Kai.png",
    title: "Morning news digest",
    summary: "Compiled top stories from 12 sources",
    body: "## Headlines\n- Tech earnings beat expectations\n- New climate report released",
    category: FeedCategory.Research,
    completedAt: "2026-02-28T08:00:00Z",
  },
  {
    id: "2",
    agentName: "Archivist",
    avatarState: "dormant",
    portraitId: "avatar:preset:Reginald",
    avatar: "/avatars/Reginald.png",
    title: "Weekly backup complete",
    summary: "All documents synced to cloud storage",
    body: "Backed up 342 files across 5 directories.",
    category: FeedCategory.Task,
    completedAt: "2026-02-27T22:00:00Z",
  },
  {
    id: "3",
    agentName: "Sentinel",
    avatarState: "attentive",
    portraitId: "avatar:preset:Stjarni",
    avatar: "/avatars/Stjarni.png",
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

const imageUrl: FeedItemResolvers["imageUrl"] = (parent, args, ctx) => {
  const base = ctx.mediaCdnUrl.replace(/\/$/, "");
  const widthParam = args.width ? `?width=${args.width}` : "";
  return `${base}${parent.avatar}${widthParam}`;
};

export const feedResolvers = {
  Query: { feedItems, feedItem },
  FeedItem: { imageUrl },
};
