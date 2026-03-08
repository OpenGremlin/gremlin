#!/usr/bin/env bash
set -euo pipefail

export DISPLAY=:1
export HOME=/tmp/sandbox-home

mkdir -p "${HOME}" "${HOME}/.chrome"

# Start virtual display
Xvfb :1 -screen 0 1280x800x24 -ac -nolisten tcp &

# Launch headless Chromium with CDP
chromium \
  --headless=new \
  --disable-gpu \
  --no-sandbox \
  --disable-setuid-sandbox \
  --disable-dev-shm-usage \
  --remote-debugging-address=0.0.0.0 \
  --remote-debugging-port=9222 \
  --user-data-dir="${HOME}/.chrome" \
  --no-first-run \
  --no-default-browser-check \
  --disable-background-networking \
  --disable-features=TranslateUI \
  --disable-breakpad \
  --disable-crash-reporter \
  about:blank &

# Wait for CDP to be ready
for _ in $(seq 1 50); do
  if curl -sS --max-time 1 "http://127.0.0.1:9222/json/version" >/dev/null 2>&1; then
    echo "CDP ready on port 9222"
    break
  fi
  sleep 0.2
done

wait -n
