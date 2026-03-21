---
name: agent-browser
description: >-
  Browser automation CLI for AI agents. Use when interacting
  with websites: navigating pages, filling forms, clicking
  buttons, taking screenshots, extracting data, testing web
  apps, or automating any browser task.
metadata:
  version: 1.0.0
  displayName: Vercel Agent Browser
  author: gremlin
  category: web
  icon: globe
  tags: [browser, web, automation, scraping, testing]
  install: |
    npm install -g agent-browser
    agent-browser install
  allowedCommands:
    - agent-browser
---

# Browser Automation with agent-browser

The CLI uses Chrome/Chromium via CDP directly. Install via `npm i -g agent-browser`, `brew install agent-browser`, or `cargo install agent-browser`. Run `agent-browser install` to download Chrome. Run `agent-browser upgrade` to update to the latest version.

## Core Workflow

Every browser automation follows this pattern:

1. **Navigate**: `agent-browser open <url>`
2. **Snapshot**: `agent-browser snapshot -i` (get element refs like `@e1`, `@e2`)
3. **Interact**: Use refs to click, fill, select
4. **Re-snapshot**: After navigation or DOM changes, get fresh refs

```bash
agent-browser open https://example.com/form
agent-browser snapshot -i
# Output: @e1 [input type="email"], @e2 [input type="password"], @e3 [button] "Submit"

agent-browser fill @e1 "user@example.com"
agent-browser fill @e2 "password123"
agent-browser click @e3
agent-browser wait --load networkidle
agent-browser snapshot -i  # Check result
```

## Available commands

| Command | Description | Reference |
|---------|-------------|-----------|
| `open` | Navigate to a URL | `commands` |
| `snapshot` | Get page accessibility tree with element refs | `snapshot-refs` |
| `click` | Click an element | `commands` |
| `fill` | Clear and type text into an input | `commands` |
| `type` | Type text without clearing | `commands` |
| `select` | Choose a dropdown option | `commands` |
| `check` / `uncheck` | Toggle checkboxes | `commands` |
| `press` | Press a keyboard key | `commands` |
| `scroll` | Scroll the page or a container | `commands` |
| `get` | Extract text, HTML, attributes, URL, title | `commands` |
| `wait` | Wait for elements, text, URL, network idle | `commands` |
| `screenshot` | Capture page screenshot | `commands` |
| `pdf` | Save page as PDF | `commands` |
| `state save/load` | Persist and restore auth state | `authentication` |
| `record` | Record video of browser session | `video-recording` |
| `network` | Intercept/block/mock network requests | `commands` |
| `eval` | Run JavaScript in the browser | `commands` |
| `diff` | Compare page states (snapshot or screenshot) | `commands` |
| `session` | Manage parallel browser sessions | `session-management` |

Before using a command, load its reference for detailed flags and examples:
`readSkillReference("agent-browser", "<reference>")`

## Command Chaining

Commands can be chained with `&&` in a single shell invocation. The browser persists between commands via a background daemon.

```bash
# Chain open + wait + snapshot in one call
agent-browser open https://example.com && agent-browser wait --load networkidle && agent-browser snapshot -i

# Chain multiple interactions
agent-browser fill @e1 "user@example.com" && agent-browser fill @e2 "password123" && agent-browser click @e3
```

**When to chain:** Use `&&` when you don't need to read the output of an intermediate command before proceeding. Run commands separately when you need to parse output first (e.g., snapshot to discover refs, then interact using those refs).

## Quick start

```bash
# Navigate and get interactive elements
agent-browser open https://example.com
agent-browser snapshot -i

# Fill a form
agent-browser fill @e1 "Jane Doe"
agent-browser fill @e2 "jane@example.com"
agent-browser click @e3

# Take a screenshot
agent-browser screenshot page.png

# Extract text
agent-browser get text @e5
agent-browser get url

# Wait for page changes
agent-browser wait --load networkidle
agent-browser wait --text "Success"
```

## Handling Authentication

```bash
# Option 1: Persistent profile (simplest for recurring tasks)
agent-browser --profile ~/.myapp open https://app.example.com/login

# Option 2: Session name (auto-save/restore cookies)
agent-browser --session-name myapp open https://app.example.com/login

# Option 3: State file (manual save/load)
agent-browser state save ./auth.json
agent-browser state load ./auth.json

# Option 4: Auth vault (encrypted credentials)
echo "$PASSWORD" | agent-browser auth save myapp --url https://app.example.com/login --username user --password-stdin
agent-browser auth login myapp
```

See `readSkillReference("agent-browser", "authentication")` for OAuth, 2FA, and cookie-based auth patterns.

## Ref Lifecycle (Important)

Refs (`@e1`, `@e2`, etc.) are invalidated when the page changes. Always re-snapshot after:

- Clicking links or buttons that navigate
- Form submissions
- Dynamic content loading (dropdowns, modals)

```bash
agent-browser click @e5              # Navigates to new page
agent-browser snapshot -i            # MUST re-snapshot
agent-browser click @e1              # Use new refs
```

## Working with Iframes

Iframe content is automatically inlined in snapshots. Refs inside iframes carry frame context, so you can interact with them directly.

```bash
agent-browser snapshot -i
# @e2 [Iframe] "payment-frame"
#   @e3 [input] "Card number"

agent-browser fill @e3 "4111111111111111"  # No frame switch needed
```

## Semantic Locators (Alternative to Refs)

When refs are unavailable, use semantic locators:

```bash
agent-browser find text "Sign In" click
agent-browser find label "Email" fill "user@test.com"
agent-browser find role button click --name "Submit"
agent-browser find testid "submit-btn" click
```

## JavaScript Evaluation

Use `eval` to run JavaScript in the browser. Use `--stdin` for complex expressions to avoid shell quoting issues.

```bash
# Simple expression
agent-browser eval 'document.title'

# Complex JS via stdin
agent-browser eval --stdin <<'EVALEOF'
JSON.stringify(
  Array.from(document.querySelectorAll("a")).map(a => a.href)
)
EVALEOF
```

## Session Management

```bash
# Parallel sessions
agent-browser --session site1 open https://site-a.com
agent-browser --session site2 open https://site-b.com

# List and cleanup
agent-browser session list
agent-browser close
```

## Safety

- Always close your browser session when done to avoid leaked processes.
- State files contain session tokens in plaintext -- add to `.gitignore`.
- Set `AGENT_BROWSER_ENCRYPTION_KEY` for encryption at rest.
- Confirm destructive actions with the user before proceeding.
