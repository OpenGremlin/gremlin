import { useEffect, useRef } from "react";
import {
  agentSubscriptionManager,
  documentSubscriptionManager,
  taskSubscriptionManager,
} from "./managers";

type Callback<T> = (entity: T) => void;

function useBatchSubscription<T>(
  manager: { subscribe(id: string, cb: (e: Record<string, unknown>) => void): () => void },
  id: string,
  onData: Callback<T>,
) {
  const onDataRef = useRef(onData);
  onDataRef.current = onData;

  useEffect(() => {
    return manager.subscribe(id, (entity) => {
      onDataRef.current(entity as T);
    });
  }, [manager, id]);
}

export function useTaskUpdates<T = Record<string, unknown>>(
  taskId: string,
  onData: Callback<T>,
) {
  useBatchSubscription(taskSubscriptionManager, taskId, onData);
}

export function useAgentUpdates<T = Record<string, unknown>>(
  agentId: string,
  onData: Callback<T>,
) {
  useBatchSubscription(agentSubscriptionManager, agentId, onData);
}

export function useDocumentUpdates<T = Record<string, unknown>>(
  docId: string,
  onData: Callback<T>,
) {
  useBatchSubscription(documentSubscriptionManager, docId, onData);
}
