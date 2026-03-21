import { createContext, useContext, useMemo } from "react";
import type {
  PendingCommandApprovalsQuery as ApprovalsQueryType,
  UserInputRequestsQuery as InputRequestsQueryType,
} from "../graphql/generated/graphql";
import {
  PendingCommandApprovalsQuery,
  UserInputRequestsQuery,
} from "../graphql/queries";
import { useQuery } from "../hooks/useQuery";

type Approval = ApprovalsQueryType["pendingCommandApprovals"][number];
type InputRequest = InputRequestsQueryType["userInputRequests"][number];

interface PendingCountValue {
  approvals: Approval[];
  inputRequests: InputRequest[];
  pendingCount: number;
  refetchApprovals: () => void;
  refetchInputRequests: () => void;
}

const PendingCountContext = createContext<PendingCountValue>({
  approvals: [],
  inputRequests: [],
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

  const approvals = approvalsData?.pendingCommandApprovals ?? [];
  const inputRequests = (inputRequestsData?.userInputRequests ?? []).filter(
    (r) => r.status === "PENDING",
  );
  const pendingCount = approvals.length + inputRequests.length;

  const value = useMemo(
    () => ({
      approvals,
      inputRequests,
      pendingCount,
      refetchApprovals,
      refetchInputRequests,
    }),
    [
      approvals,
      inputRequests,
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
