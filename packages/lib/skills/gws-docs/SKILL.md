---
name: gws-docs
description: >-
  Read, create, and write Google Docs documents via the
  Google Workspace CLI (gws). Use when the user asks about
  documents, Docs, or writing/reading document content.
metadata:
  version: 1.0.0
  displayName: Google Docs (GWS CLI)
  author: gremlin
  category: google-workspace
  icon: google
  tags: [google, docs, documents, writing, productivity]
  install: |
    which gws || npm install -g @googleworkspace/cli
  allowedCommands:
    - gws
  connections:
    - provider: google
      env:
        GOOGLE_WORKSPACE_CLI_TOKEN: accessToken
      reason: Access Google Docs to read and write documents.
      multi: true
      requestedScopes: [documents, documents.readonly]
---

# Google Docs

You have access to Google Docs via the `gws` CLI.

## Available commands

| Command | Description | Reference |
|---------|-------------|-----------|
| `+write` | Append text to a document | `write` |

Before using a command, load its reference for detailed flags and examples:
`readSkillReference("gws-docs", "<reference>")`

## Quick start

```bash
# Create a new document
gws docs documents create --json '{"title":"Meeting Notes"}'

# Read a document
gws docs documents get --params '{"documentId":"DOC_ID"}'

# Append text
gws docs +write --document DOC_ID --text 'Hello, world!'
```

## Raw API access

```bash
gws docs <resource> <method> [flags]
```

| Flag | Description |
|------|-------------|
| `--params '{...}'` | URL/query parameters |
| `--json '{...}'` | Request body |
| `--format json\|table\|yaml\|csv` | Output format (default: json) |
| `--dry-run` | Preview without calling API |

### Common API calls

```bash
# Batch update (insert text at a position)
gws docs documents batchUpdate --params '{"documentId":"DOC_ID"}' --json '{"requests":[{"insertText":{"location":{"index":1},"text":"Inserted text\n"}}]}'

# Get document as plain text (body content)
gws docs documents get --params '{"documentId":"DOC_ID"}' --format json | jq '.body.content'
```

### Discovery

```bash
gws docs --help                           # browse resources
gws schema docs.<resource>.<method>       # inspect parameters
```

## Safety

- Prefer `--dry-run` to preview destructive operations.
