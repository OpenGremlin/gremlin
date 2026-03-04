#!/bin/sh
set -e

# Create persistent tool directories on EFS-backed /workspace
mkdir -p /workspace/.tools/bin \
         /workspace/.tools/go/bin \
         /workspace/.tools/cargo/bin \
         /workspace/.tools/python

exec "$@"
