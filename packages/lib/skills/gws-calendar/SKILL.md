---
name: gws-calendar
description: >-
  View agenda, create events, check free/busy, and manage
  Google Calendar via the Google Workspace CLI (gws). Use
  when the user asks about calendar, events, meetings, or
  scheduling.
metadata:
  version: 1.0.0
  displayName: Google Calendar (GWS CLI)
  author: gremlin
  category: google-workspace
  icon: google
  tags: [google, calendar, events, scheduling, productivity]
  install: |
    which gws || npm install -g @googleworkspace/cli
  allowedCommands:
    - gws
  connections:
    - provider: google
      env:
        GOOGLE_WORKSPACE_CLI_TOKEN: accessToken
      reason: Access Google Calendar to view and manage events.
      multi: true
      requestedScopes: [calendar.readonly, calendar.events]
---

# Google Calendar

You have access to Google Calendar via the `gws` CLI.

## Available commands

| Command | Description | Reference |
|---------|-------------|-----------|
| `+agenda` | Show upcoming events across all calendars | `agenda` |
| `+insert` | Create a new event | `insert` |

Before using a command, load its reference for detailed flags and examples:
`readSkillReference("gws-calendar", "<reference>")`

## Quick start

```bash
# View today's events
gws calendar +agenda --today

# View this week
gws calendar +agenda --week

# Create an event
gws calendar +insert --summary 'Standup' --start '2026-06-17T09:00:00-07:00' --end '2026-06-17T09:30:00-07:00'
```

## Raw API access

For operations not covered by helper commands:

```bash
gws calendar <resource> <method> [flags]
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
# List events on primary calendar
gws calendar events list --params '{"calendarId":"primary","timeMin":"2026-03-18T00:00:00Z","maxResults":10}'

# Check free/busy
gws calendar freebusy query --json '{"timeMin":"...","timeMax":"...","items":[{"id":"primary"}]}'

# Delete an event
gws calendar events delete --params '{"calendarId":"primary","eventId":"EVENT_ID"}'

# Update an event
gws calendar events patch --params '{"calendarId":"primary","eventId":"EVENT_ID"}' --json '{"summary":"New Title"}'
```

### Discovery

```bash
gws calendar --help                           # browse resources
gws schema calendar.<resource>.<method>       # inspect parameters
```

## Safety

- Prefer `--dry-run` to preview destructive operations.
