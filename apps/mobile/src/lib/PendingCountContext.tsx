import { useQuery, useSubscription } from "@apollo/client";
import { createContext, useContext, useMemo } from "react";
import type {
  PendingCommandApprovalsQuery as ApprovalsQueryType,
  UserInputRequestsQuery as InputRequestsQueryType,
} from "../graphql/generated/graphql";
import {
  PendingCommandApprovalsQuery,
  PendingItemsUpdatedSubscription,
  UserInputRequestsQuery,
} from "../graphql/queries";

type Approval = ApprovalsQueryType["pendingCommandApprovals"][number];
type InputRequest = InputRequestsQueryType["userInputRequests"][number];

// ── Approval-specific context (for CommandApprovalCard in chat list) ──
interface ApprovalsValue {
  allApprovals: Approval[];
  refetchApprovals: () => void;
}

const ApprovalsContext = createContext<ApprovalsValue>({
  allApprovals: [],
  refetchApprovals: () => {},
});

// ── InputRequest-specific context (for InputRequestCard in chat list) ──
interface InputRequestsValue {
  allInputRequests: InputRequest[];
  refetchInputRequests: () => void;
}

const InputRequestsContext = createContext<InputRequestsValue>({
  allInputRequests: [],
  refetchInputRequests: () => {},
});

// ── Aggregate context (for home screen badge counts, pending lists) ──
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

  useSubscription(PendingItemsUpdatedSubscription, {
    onData: () => {
      refetchApprovals();
      refetchInputRequests();
    },
  });

  const allApprovals = useMemo(
    () => approvalsData?.pendingCommandApprovals ?? [],
    [approvalsData],
  );
  const approvals = useMemo(
    () => allApprovals.filter((a) => a.status === "PENDING"),
    [allApprovals],
  );
  const allInputRequests = useMemo(
    () => inputRequestsData?.userInputRequests ?? [],
    [inputRequestsData],
  );
  const inputRequests = useMemo(
    () => allInputRequests.filter((r) => r.status === "PENDING"),
    [allInputRequests],
  );
  const pendingCount = approvals.length + inputRequests.length;

  const approvalsValue = useMemo(
    () => ({ allApprovals, refetchApprovals }),
    [allApprovals, refetchApprovals],
  );

  const inputRequestsValue = useMemo(
    () => ({ allInputRequests, refetchInputRequests }),
    [allInputRequests, refetchInputRequests],
  );

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
    <ApprovalsContext.Provider value={approvalsValue}>
      <InputRequestsContext.Provider value={inputRequestsValue}>
        <PendingCountContext.Provider value={value}>
          {children}
        </PendingCountContext.Provider>
      </InputRequestsContext.Provider>
    </ApprovalsContext.Provider>
  );
}

export function usePendingCount() {
  return useContext(PendingCountContext);
}

/** For CommandApprovalCard — only re-renders when approvals data changes. */
export function useAllApprovals() {
  return useContext(ApprovalsContext);
}

/** For InputRequestCard — only re-renders when input requests data changes. */
export function useAllInputRequests() {
  return useContext(InputRequestsContext);
}
