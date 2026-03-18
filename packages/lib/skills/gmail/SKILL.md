---
name: gmail
description: >-
  Read, triage, send, reply, and forward email via the
  Google Workspace CLI (gws). Use when the user asks about
  email, inbox, messages, or Gmail.
metadata:
  version: 1.0.0
  author: gremlin
  category: productivity
  icon: google
  tags: [google, email, gmail, productivity]
  connections:
    - provider: google
      env:
        GOOGLE_WORKSPACE_CLI_TOKEN: accessToken
      reason: Access Gmail to read and send email.
      multi: true
      requestedScopes: [gmail.readonly, gmail.send]
---

# Gmail

You have access to Gmail via the `gws` CLI.

## Available commands

| Command | Description | Reference |
|---------|-------------|-----------|
| `+triage` | Unread inbox summary (sender, subject, date) | `triage` |
| `+read` | Read a message body and headers | `read` |
| `+send` | Send a new email | `send` |
| `+reply` | Reply to a message (auto-threading) | `reply` |
| `+reply-all` | Reply-all to a message | `reply` |
| `+forward` | Forward a message to new recipients | `forward` |
| `+watch` | Watch for new emails via Pub/Sub | `watch` |

Before using a command, load its reference for detailed flags and examples:
`readSkillReference("gmail", "<reference>")`

## Quick start

```bash
# Check inbox
gws gmail +triage

# Read a message
gws gmail +read --id MSG_ID

# Send an email
gws gmail +send --to alice@example.com --subject 'Hello' --body 'Hi Alice!'

# Reply
gws gmail +reply --message-id MSG_ID --body 'Thanks!'
```

## Raw API access

For operations not covered by helper commands:

```bash
gws gmail <resource> <method> [flags]
```

| Flag | Description |
|------|-------------|
| `--params '{...}'` | URL/query parameters |
| `--json '{...}'` | Request body |
| `--page-all` | Auto-paginate (NDJSON output) |
| `--format json\|table\|yaml\|csv` | Output format (default: json) |
| `--dry-run` | Preview without calling API |

### Discovery

```bash
gws gmail --help                           # browse resources
gws schema gmail.<resource>.<method>       # inspect parameters
```

## Safety

- Prefer `--dry-run` to preview destructive operations.
