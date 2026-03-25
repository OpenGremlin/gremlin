import NetInfo from "@react-native-community/netinfo";

const POLL_INTERVAL = 5_000;

let connected = true;
const listeners = new Set<(isConnected: boolean) => void>();

function update(next: boolean) {
  if (next === connected) return;
  connected = next;
  for (const cb of listeners) cb(next);
}

NetInfo.addEventListener((state) => {
  update(state.isConnected !== false);
});

// Periodic poll as a fallback — NetInfo events can miss reconnections.
setInterval(async () => {
  const state = await NetInfo.fetch();
  update(state.isConnected !== false);
}, POLL_INTERVAL);

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
