---
name: Gmail
description: >-
  Read, triage, send, reply, and forward email via the
  Google Workspace CLI (gws).
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

install: |
  npm install -g @googleworkspace/cli

---

# Gmail

You have access to Gmail via the `gws` CLI.

## Triage — unread inbox summary

```bash
gws gmail +triage                          # unread inbox (default 20)
gws gmail +triage --max 5                  # limit results
gws gmail +triage --query 'from:boss'      # custom Gmail search
gws gmail +triage --labels                 # include label names
```

Read-only. Defaults to table output.

## Send

```bash
gws gmail +send --to alice@example.com --subject 'Hello' --body 'Hi Alice!'
gws gmail +send --to alice@example.com --subject 'Hi' --cc bob@example.com
gws gmail +send --to alice@example.com --subject 'Hi' --body '<b>Bold</b>' --html
```

Flags: `--to` (required), `--subject` (required), `--body` (required), `--cc`, `--bcc`, `--html`, `--dry-run`.

## Reply

```bash
gws gmail +reply --message-id MSG_ID --body 'Thanks, got it!'
gws gmail +reply --message-id MSG_ID --body 'Looping in Carol' --cc carol@example.com
```

Automatically sets threading headers and quotes the original message. Use `+reply-all` to reply to all recipients.

Flags: `--message-id` (required), `--body` (required), `--to`, `--cc`, `--bcc`, `--from`, `--html`, `--dry-run`.

## Forward

```bash
gws gmail +forward --message-id MSG_ID --to dave@example.com
gws gmail +forward --message-id MSG_ID --to dave@example.com --body 'FYI see below'
```

Flags: `--message-id` (required), `--to` (required), `--body`, `--cc`, `--bcc`, `--from`, `--html`, `--dry-run`.

## Raw API access

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

### Common API calls

```bash
# List messages matching a query
gws gmail users messages list --params '{"q":"is:unread","maxResults":10}'

# Get full message content
gws gmail users messages get --params '{"id":"MSG_ID","format":"full"}'

# List labels
gws gmail users labels list
```

### Discovery

```bash
gws gmail --help                           # browse resources
gws schema gmail.<resource>.<method>       # inspect parameters
```

## Dry Run

- Prefer `--dry-run` to preview destructive operations.
