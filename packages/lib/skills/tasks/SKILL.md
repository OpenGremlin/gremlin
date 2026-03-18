---
name: tasks
description: >-
  Create, list, update, and manage Google Tasks lists and
  items via the Google Workspace CLI (gws). Use when the
  user asks about tasks, to-dos, or task lists.
metadata:
  version: 1.0.0
  author: gremlin
  category: productivity
  icon: google
  tags: [google, tasks, todo, productivity]
  connections:
    - provider: google
      env:
        GOOGLE_WORKSPACE_CLI_TOKEN: accessToken
      reason: Access Google Tasks to manage task lists and items.
      multi: true
      requestedScopes: [tasks, tasks.readonly]
---

# Google Tasks

You have access to Google Tasks via the `gws` CLI.

## Quick start

```bash
# List all task lists
gws tasks tasklists list

# List tasks in a task list
gws tasks tasks list --params '{"tasklist":"TASKLIST_ID"}'

# Create a task
gws tasks tasks insert --params '{"tasklist":"TASKLIST_ID"}' --json '{"title":"Buy groceries","due":"2026-03-20T00:00:00Z"}'

# Complete a task
gws tasks tasks patch --params '{"tasklist":"TASKLIST_ID","task":"TASK_ID"}' --json '{"status":"completed"}'

# Create a new task list
gws tasks tasklists insert --json '{"title":"Work"}'
```

## Raw API access

```bash
gws tasks <resource> <method> [flags]
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
# List overdue tasks
gws tasks tasks list --params '{"tasklist":"TASKLIST_ID","dueMax":"2026-03-18T23:59:59Z","showCompleted":false}'

# Delete a task
gws tasks tasks delete --params '{"tasklist":"TASKLIST_ID","task":"TASK_ID"}'

# Move a task (reorder)
gws tasks tasks move --params '{"tasklist":"TASKLIST_ID","task":"TASK_ID","previous":"PREV_TASK_ID"}'
```

### Discovery

```bash
gws tasks --help                           # browse resources
gws schema tasks.<resource>.<method>       # inspect parameters
```

## Safety

- Prefer `--dry-run` to preview destructive operations.
