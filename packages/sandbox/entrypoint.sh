#!/bin/sh
set -e

# Create tool directories under sandbox user's home
SANDBOX_HOME="/home/${SANDBOX_USER:-sandbox}"
mkdir -p "$SANDBOX_HOME/.tools/bin" \
         "$SANDBOX_HOME/.tools/go/bin" \
         "$SANDBOX_HOME/.tools/cargo/bin" \
         "$SANDBOX_HOME/.tools/python"
chown -R "${SANDBOX_USER:-sandbox}:${SANDBOX_USER:-sandbox}" "$SANDBOX_HOME/.tools"

# Start the relay process (foreground)
exec "$@"
