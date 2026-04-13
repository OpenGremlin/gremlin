#!/bin/bash
# Creates the gremlin database on first start.
# Skips if the database already exists (persistent volume).

set -euo pipefail

DB_PATH="/var/lib/dolt/gremlin"

# Dolt requires identity for commits
dolt config --global --add user.email "gremlin@local"
dolt config --global --add user.name "Gremlin"

if [ ! -d "$DB_PATH/.dolt" ]; then
  echo "Initializing gremlin database..."
  mkdir -p "$DB_PATH"
  cd "$DB_PATH"
  dolt init
  echo "  gremlin database created"
else
  echo "  gremlin database already exists"
fi

echo "Starting Dolt SQL server..."
exec dolt sql-server --host 0.0.0.0 --port 3306 --data-dir /var/lib/dolt
