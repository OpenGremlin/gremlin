import { getApiUrl } from "./config";

const POLL_INTERVAL = 5_000;

let connected = true;
let pollTimer: ReturnType<typeof setInterval> | null = null;
const listeners = new Set<(isConnected: boolean) => void>();

function update(next: boolean) {
  if (next === connected) return;
  connected = next;
  // Only poll when offline — successful gql requests report connectivity directly.
  if (next) {
    stopPolling();
  } else {
    startPolling();
  }
  for (const cb of listeners) cb(next);
}

async function ping(): Promise<boolean> {
  try {
    const res = await fetch(`${getApiUrl()}/api/health`, {
      method: "HEAD",
      cache: "no-store",
    });
    return res.ok;
  } catch {
    return false;
  }
}

function startPolling() {
  if (pollTimer) return;
  pollTimer = setInterval(async () => {
    update(await ping());
  }, POLL_INTERVAL);
}

function stopPolling() {
  if (!pollTimer) return;
  clearInterval(pollTimer);
  pollTimer = null;
}

export function isOnline(): boolean {
  return connected;
}

/** Mark connectivity from an external signal (e.g. a failed/successful fetch). */
export function reportConnectivity(online: boolean) {
  update(online);
}

export function onConnectivityChange(
  cb: (isConnected: boolean) => void,
): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}
