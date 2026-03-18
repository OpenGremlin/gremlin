---
name: drive
description: >-
  Search, upload, download, and manage files, folders, and
  permissions on Google Drive via the Google Workspace CLI
  (gws). Use when the user asks about files, folders, Drive,
  sharing, or uploads.
metadata:
  version: 1.0.0
  author: gremlin
  category: productivity
  icon: google
  tags: [google, drive, files, storage, productivity]
  connections:
    - provider: google
      env:
        GOOGLE_WORKSPACE_CLI_TOKEN: accessToken
      reason: Access Google Drive to manage files and folders.
      multi: true
      requestedScopes: [drive.readonly, drive.file]
---

# Google Drive

You have access to Google Drive via the `gws` CLI.

## Available commands

| Command | Description | Reference |
|---------|-------------|-----------|
| `+upload` | Upload a file with automatic MIME detection | `upload` |

Before using a command, load its reference for detailed flags and examples:
`readSkillReference("drive", "<reference>")`

## Quick start

```bash
# Search for files
gws drive files list --params '{"q":"name contains '\''report'\''","fields":"files(id,name,mimeType)"}'

# Upload a file
gws drive +upload ./report.pdf

# Download a file
gws drive files get --params '{"fileId":"FILE_ID","alt":"media"}' > output.pdf

# Share a file
gws drive permissions create --params '{"fileId":"FILE_ID"}' --json '{"role":"reader","type":"user","emailAddress":"alice@example.com"}'
```

## Raw API access

```bash
gws drive <resource> <method> [flags]
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
# List files in a folder
gws drive files list --params '{"q":"'\''FOLDER_ID'\'' in parents","fields":"files(id,name,mimeType)"}'

# Get file metadata
gws drive files get --params '{"fileId":"FILE_ID","fields":"id,name,mimeType,size,webViewLink"}'

# Create a folder
gws drive files create --json '{"name":"New Folder","mimeType":"application/vnd.google-apps.folder"}'

# Move a file to a folder
gws drive files update --params '{"fileId":"FILE_ID","addParents":"FOLDER_ID","removeParents":"OLD_PARENT_ID"}'

# List permissions
gws drive permissions list --params '{"fileId":"FILE_ID","fields":"permissions(id,role,emailAddress)"}'

# Delete a file
gws drive files delete --params '{"fileId":"FILE_ID"}'
```

### Discovery

```bash
gws drive --help                           # browse resources
gws schema drive.<resource>.<method>       # inspect parameters
```

## Safety

- Prefer `--dry-run` to preview destructive operations.
