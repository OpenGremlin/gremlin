#!/bin/sh
set -e

# Create persistent tool directories on EFS-backed /workspace
mkdir -p /workspace/.tools/bin \
         /workspace/.tools/go/bin \
         /workspace/.tools/cargo/bin \
         /workspace/.tools/python

# Start the relay process in the background
"$@" &
RELAY_PID=$!

# Wait for the health endpoint to come up, then notify the server
if [ -n "$NOTIFY_HOOK_URL" ] && [ -n "$AGENT_ID" ]; then
  (
    HEALTH_URL="http://localhost:${HEALTH_PORT:-8083}/health"
    for i in $(seq 1 60); do
      if curl -sf "$HEALTH_URL" > /dev/null 2>&1; then
        echo "entrypoint: Relay is healthy, notifying server"
        node /app/packages/sandbox/notify-server.mjs
        break
      fi
      sleep 1
    done
  ) &
fi

# Wait for the relay process
wait $RELAY_PID
