import { useCallback, useState } from "react";

// biome-ignore lint/suspicious/noConfusingVoidType: void is correct here for callback return type compatibility
export function useListRefresh(refetch: () => void | Promise<unknown>) {
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);
  return { refreshing, onRefresh };
}
