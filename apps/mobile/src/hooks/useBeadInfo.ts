import { useQuery } from "@apollo/client";
import { useEffect } from "react";
import { GetBeadQuery } from "../graphql/queries/beads";

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
  const { data, startPolling, stopPolling } = useQuery(GetBeadQuery, {
    variables: { id: beadId ?? "" },
    skip: !beadId,
    // network-only: bead may not exist in the DB when the card first
    // renders (race between tool call and UI query). We poll until loaded.
    fetchPolicy: "network-only",
  });

  // Poll every 3s while the bead hasn't loaded, stop once it has data.
  useEffect(() => {
    if (!data?.bead) {
      startPolling(3000);
    } else {
      stopPolling();
    }
  }, [data?.bead, startPolling, stopPolling]);

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
