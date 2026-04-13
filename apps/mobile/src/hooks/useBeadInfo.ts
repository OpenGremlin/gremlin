import { useQuery, useSubscription } from "@apollo/client";
import {
  BeadUpdatedSubscription,
  GetBeadQuery,
} from "../graphql/queries/beads";

export interface BeadChild {
  id: string;
  title: string;
  status: string;
  assignee: string | null;
  assigneeName: string | null;
  latestComment: string | null;
}

export interface BeadInfo {
  id: string;
  title: string;
  status: string;
  assignee: string | null;
  assigneeName: string | null;
  parentId: string | null;
  latestComment: string | null;
  children: BeadChild[];
}

/**
 * Fetches a bead by ID and subscribes to live updates.
 */
export function useBeadInfo(beadId: string | null): BeadInfo | null {
  const { data } = useQuery(GetBeadQuery, {
    variables: { id: beadId ?? "" },
    skip: !beadId,
  });

  useSubscription(BeadUpdatedSubscription, {
    variables: { id: beadId ?? "" },
    skip: !beadId,
    onData: ({ client, data: subData }) => {
      if (!subData.data?.beadUpdated) return;
      // Update the Apollo cache so the useQuery result re-renders
      client.writeQuery({
        query: GetBeadQuery,
        variables: { id: beadId },
        data: { bead: subData.data.beadUpdated },
      });
    },
  });

  const bead = data?.bead;
  if (!bead) return null;

  return {
    id: bead.id,
    title: bead.title,
    status: bead.status,
    assignee: bead.assignee ?? null,
    assigneeName: bead.assigneeName ?? null,
    parentId: bead.parentId ?? null,
    latestComment: bead.latestComment ?? null,
    children: (bead.children ?? []).map((c: BeadChild) => ({
      id: c.id,
      title: c.title,
      status: c.status,
      assignee: c.assignee ?? null,
      assigneeName: c.assigneeName ?? null,
      latestComment: c.latestComment ?? null,
    })),
  };
}
