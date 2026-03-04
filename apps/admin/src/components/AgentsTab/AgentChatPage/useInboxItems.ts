import { useCallback, useState } from "react";
import type { InboxItemsQuery } from "../../../graphql/generated/graphql";
import {
  InboxItemSubscription,
  InboxItemsQuery as InboxItemsDoc,
} from "../../../graphql/queries";
import { useQuery } from "../../../useQuery";
import { useSubscription } from "../../../useSubscription";

export type InboxItem = InboxItemsQuery["inboxItems"][number];

export function useInboxItems(agentId: string) {
  const { data, loading } = useQuery(InboxItemsDoc, { agentId });
  const [liveItems, setLiveItems] = useState<InboxItem[]>([]);

  useSubscription(
    InboxItemSubscription,
    { agentId },
    useCallback((data) => {
      const item = data.inboxItemCreated;
      setLiveItems((prev) => {
        if (prev.some((i) => i.id === item.id)) return prev;
        return [...prev, item];
      });
    }, []),
  );

  // Merge initial query with live subscription items, dedup by id
  const initial = data?.inboxItems ?? [];
  const seen = new Set<string>();
  const merged: InboxItem[] = [];
  for (const item of [...initial, ...liveItems]) {
    if (!seen.has(item.id)) {
      seen.add(item.id);
      merged.push(item);
    }
  }

  // Only show unread items
  const unread = merged.filter((i) => !i.isRead);

  return { items: unread, loading };
}
