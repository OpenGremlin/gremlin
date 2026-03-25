import { useEffect, useState } from "react";
import { isOnline, onConnectivityChange } from "../lib/networkState";

export function useNetworkStatus() {
  const [isConnected, setIsConnected] = useState(isOnline);

  useEffect(() => {
    return onConnectivityChange(setIsConnected);
  }, []);

  return { isConnected };
}
