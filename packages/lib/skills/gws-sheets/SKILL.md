---
name: gws-sheets
description: >-
  Read, write, and append data in Google Sheets spreadsheets
  via the Google Workspace CLI (gws). Use when the user asks
  about spreadsheets, Sheets, data entry, or tabular data.
metadata:
  version: 1.0.0
  displayName: Google Sheets (GWS CLI)
  author: gremlin
  category: google-workspace
  icon: google
  tags: [google, sheets, spreadsheet, data, productivity]
  install: |
    which gws || npm install -g @googleworkspace/cli
  allowedCommands:
    - gws
  connections:
    - provider: google
      env:
        GOOGLE_WORKSPACE_CLI_TOKEN: accessToken
      reason: Access Google Sheets to read and write spreadsheet data.
      multi: true
      requestedScopes: [spreadsheets, spreadsheets.readonly]
---

# Google Sheets

You have access to Google Sheets via the `gws` CLI.

## Available commands

| Command | Description | Reference |
|---------|-------------|-----------|
| `+read` | Read values from a spreadsheet range | `read` |
| `+append` | Append rows to a spreadsheet | `append` |

Before using a command, load its reference for detailed flags and examples:
`readSkillReference("gws-sheets", "<reference>")`

## Quick start

```bash
# Read a range
gws sheets +read --spreadsheet SHEET_ID --range 'Sheet1!A1:D10'

# Append a row
gws sheets +append --spreadsheet SHEET_ID --values 'Alice,100,true'

# Append multiple rows
gws sheets +append --spreadsheet SHEET_ID --json-values '[["Alice",100],["Bob",200]]'
```

## Raw API access

```bash
gws sheets <resource> <method> [flags]
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
# Create a new spreadsheet
gws sheets spreadsheets create --json '{"properties":{"title":"My Sheet"}}'

# Get spreadsheet metadata
gws sheets spreadsheets get --params '{"spreadsheetId":"SHEET_ID"}'

# Batch update values
gws sheets spreadsheets values batchUpdate --params '{"spreadsheetId":"SHEET_ID"}' --json '{"valueInputOption":"USER_ENTERED","data":[{"range":"Sheet1!A1","values":[["Hello","World"]]}]}'
```

### Discovery

```bash
gws sheets --help                           # browse resources
gws schema sheets.<resource>.<method>       # inspect parameters
```

## Safety

- Prefer `--dry-run` to preview destructive operations.
