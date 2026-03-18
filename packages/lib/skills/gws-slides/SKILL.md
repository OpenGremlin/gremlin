---
name: gws-slides
description: >-
  Create and manage Google Slides presentations via the
  Google Workspace CLI (gws). Use when the user asks about
  presentations, Slides, or slide decks.
metadata:
  version: 1.0.0
  displayName: Google Slides (GWS CLI)
  author: gremlin
  category: productivity
  icon: google
  tags: [google, slides, presentations, productivity]
  connections:
    - provider: google
      env:
        GOOGLE_WORKSPACE_CLI_TOKEN: accessToken
      reason: Access Google Slides to create and manage presentations.
      multi: true
      requestedScopes: [presentations, presentations.readonly]
---

# Google Slides

You have access to Google Slides via the `gws` CLI.

## Quick start

```bash
# Create a new presentation
gws slides presentations create --json '{"title":"Q1 Review"}'

# Get presentation metadata
gws slides presentations get --params '{"presentationId":"PRES_ID"}'

# Get a specific page/slide
gws slides presentations pages get --params '{"presentationId":"PRES_ID","pageObjectId":"PAGE_ID"}'
```

## Raw API access

```bash
gws slides <resource> <method> [flags]
```

| Flag | Description |
|------|-------------|
| `--params '{...}'` | URL/query parameters |
| `--json '{...}'` | Request body |
| `--format json\|table\|yaml\|csv` | Output format (default: json) |
| `--dry-run` | Preview without calling API |

### Common API calls

```bash
# Add a blank slide
gws slides presentations batchUpdate --params '{"presentationId":"PRES_ID"}' --json '{"requests":[{"createSlide":{"slideLayoutReference":{"predefinedLayout":"BLANK"}}}]}'

# Insert text into a shape
gws slides presentations batchUpdate --params '{"presentationId":"PRES_ID"}' --json '{"requests":[{"insertText":{"objectId":"SHAPE_ID","text":"Hello World"}}]}'

# Delete a slide
gws slides presentations batchUpdate --params '{"presentationId":"PRES_ID"}' --json '{"requests":[{"deleteObject":{"objectId":"PAGE_ID"}}]}'
```

### Discovery

```bash
gws slides --help                           # browse resources
gws schema slides.<resource>.<method>       # inspect parameters
```

## Safety

- Prefer `--dry-run` to preview destructive operations.
