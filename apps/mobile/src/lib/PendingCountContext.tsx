import { useQuery } from "@apollo/client";
import { createContext, useCallback, useContext, useMemo } from "react";
import type {
  PendingCommandApprovalsQuery as ApprovalsQueryType,
  UserInputRequestsQuery as InputRequestsQueryType,
} from "../graphql/generated/graphql";
import {
  PendingCommandApprovalsQuery,
  PendingItemsUpdatedSubscription,
  UserInputRequestsQuery,
} from "../graphql/queries";
import { useSubscription } from "../hooks/useSubscription";

type Approval = ApprovalsQueryType["pendingCommandApprovals"][number];
type InputRequest = InputRequestsQueryType["userInputRequests"][number];

interface PendingCountValue {
  approvals: Approval[];
  allApprovals: Approval[];
  inputRequests: InputRequest[];
  allInputRequests: InputRequest[];
  pendingCount: number;
  refetchApprovals: () => void;
  refetchInputRequests: () => void;
}

const PendingCountContext = createContext<PendingCountValue>({
  approvals: [],
  allApprovals: [],
  inputRequests: [],
  allInputRequests: [],
  pendingCount: 0,
  refetchApprovals: () => {},
  refetchInputRequests: () => {},
});

export function PendingCountProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: approvalsData, refetch: refetchApprovals } = useQuery(
    PendingCommandApprovalsQuery,
  );
  const { data: inputRequestsData, refetch: refetchInputRequests } = useQuery(
    UserInputRequestsQuery,
  );

  // Refetch both lists whenever the server signals a change
  useSubscription(
    PendingItemsUpdatedSubscription,
    {},
    useCallback(() => {
      refetchApprovals();
      refetchInputRequests();
    }, [refetchApprovals, refetchInputRequests]),
  );

  const allApprovals = approvalsData?.pendingCommandApprovals ?? [];
  const approvals = allApprovals.filter((a) => a.status === "PENDING");
  const allInputRequests = inputRequestsData?.userInputRequests ?? [];
  const inputRequests = allInputRequests.filter((r) => r.status === "PENDING");
  const pendingCount = approvals.length + inputRequests.length;

  const value = useMemo(
    () => ({
      approvals,
      allApprovals,
      inputRequests,
      allInputRequests,
      pendingCount,
      refetchApprovals,
      refetchInputRequests,
    }),
    [
      approvals,
      allApprovals,
      inputRequests,
      allInputRequests,
      pendingCount,
      refetchApprovals,
      refetchInputRequests,
    ],
  );

  return (
    <PendingCountContext.Provider value={value}>
      {children}
    </PendingCountContext.Provider>
  );
}

export function usePendingCount() {
  return useContext(PendingCountContext);
}
