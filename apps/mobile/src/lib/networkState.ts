import NetInfo from "@react-native-community/netinfo";

let connected = true;
const listeners = new Set<(isConnected: boolean) => void>();

NetInfo.addEventListener((state) => {
  const next = state.isConnected !== false;
  if (next === connected) return;
  connected = next;
  for (const cb of listeners) cb(next);
});

export function isOnline(): boolean {
  return connected;
}

export function onConnectivityChange(
  cb: (isConnected: boolean) => void,
): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}
