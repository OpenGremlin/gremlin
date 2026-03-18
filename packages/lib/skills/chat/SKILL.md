---
name: chat
description: >-
  Send messages and manage Google Chat spaces via the
  Google Workspace CLI (gws). Use when the user asks about
  Chat, messaging teams, or sending notifications.
metadata:
  version: 1.0.0
  author: gremlin
  category: productivity
  icon: google
  tags: [google, chat, messaging, productivity]
  connections:
    - provider: google
      env:
        GOOGLE_WORKSPACE_CLI_TOKEN: accessToken
      reason: Access Google Chat to send messages and manage spaces.
      multi: true
      requestedScopes: [chat.messages, chat.messages.readonly, chat.spaces.readonly]
---

# Google Chat

You have access to Google Chat via the `gws` CLI.

## Available commands

| Command | Description | Reference |
|---------|-------------|-----------|
| `+send` | Send a plain text message to a space | `send` |

Before using a command, load its reference for detailed flags and examples:
`readSkillReference("chat", "<reference>")`

## Quick start

```bash
# List spaces you're in
gws chat spaces list

# Send a message
gws chat +send --space spaces/AAAAxxxx --text 'Hello team!'
```

## Raw API access

```bash
gws chat <resource> <method> [flags]
```

| Flag | Description |
|------|-------------|
| `--params '{...}'` | URL/query parameters |
| `--json '{...}'` | Request body |
| `--page-all` | Auto-paginate (NDJSON output) |
| `--format json\|table\|yaml\|csv` | Output format (default: json) |
| `--dry-run` | Preview without calling API |

### Common API calls

```bash
# List messages in a space
gws chat spaces messages list --params '{"parent":"spaces/AAAAxxxx"}'

# Get space details
gws chat spaces get --params '{"name":"spaces/AAAAxxxx"}'

# List members of a space
gws chat spaces members list --params '{"parent":"spaces/AAAAxxxx"}'
```

### Discovery

```bash
gws chat --help                           # browse resources
gws schema chat.<resource>.<method>       # inspect parameters
```

## Safety

- Prefer `--dry-run` to preview destructive operations.
