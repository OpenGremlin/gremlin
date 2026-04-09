---
name: basic-programming
description: >-
  Load before writing any code, script, or automation in the workspace.
  Defines the hybrid agent-script execution model (programs are invoked by
  agents, not humans), project layout under programs/, README discipline,
  operation logging, and rediscovery patterns. Load this skill the moment
  a task involves writing or editing code.
metadata:
  version: 1.1.0
  displayName: Basic Programming
  author: gremlin
  category: workflow
  icon: file-code
  tags: [coding, workspace, automation, persistence]
---

# Basic Programming

When you write code in the workspace, organize it as **programs** — persistent, self-contained projects under `programs/` that survive across conversations. This is how you automate recurring work: CRM tracking, report generation, data pipelines, email triage, scrapers, schedulers, and so on. Even one-off scripts usually belong inside a program rather than at the workspace root.

## Execution model: hybrid agent + script

**The programs you write are run by agents, not by humans.** The caller is always you (in a future conversation) or another agent — never a user sitting at a terminal. Design accordingly:

- **Do not** build CLIs meant for human operators: no interactive prompts, no "press y to continue", no argparse help text as the primary interface, no waiting on stdin.
- **Do** write scripts that an agent can invoke with a single shell command, read the stdout/stderr, and act on the result.
- **Output contract:** print structured output (JSON when the caller needs to parse fields, plain text when human-readable logs suffice). Use exit code 0 for success, non-zero for failure. Write errors to stderr.
- **Argument passing:** positional args are fine for 1–3 values. For more, accept JSON on stdin or a path to a config/input file.

Because an agent is in the loop, you can **split work between the script and the agent** instead of forcing everything into code. If a step is hard or awkward in code but trivial for an agent with tools, leave it to the agent. Two common patterns:

> **Example — perception stays with the agent:**
>
> **Task:** List the book titles visible in `shelf.jpg` and insert them into the library sheet.
>
> **Usually wrong:** script tries to OCR or call a vision API itself. (Exception: if you're batch-processing hundreds of images, a direct API call in code may be faster than agent round-trips.)
>
> **Better:** The agent calls its image-viewing tool on `shelf.jpg`, reads the titles directly, then calls `programs/library/add_books.py "Title 1" "Title 2" ...` to insert rows. The script handles the mechanical part (DB insert). The perception step stays with the agent.

> **Example — context gathering is flexible:**
>
> **Task:** Generate a daily report that includes the current time.
>
> **Either approach is fine:**
> - Script uses the language's stdlib to get the current time itself (`datetime.now()`).
> - Or the agent runs `date -u` first, then passes the timestamp into the script as an argument.
>
> Pick whichever keeps the script simpler. When in doubt, let the agent gather context and pass it in.

**Rule of thumb:** if a step needs judgment, perception (vision, reading messy text), tool calls to other services the agent already has, or dynamic context — let the agent do it and feed the result into the script. The script handles the deterministic, repeatable parts.

## Layout

Each program is a folder under `programs/`:

```
/workspace/
└── programs/
    ├── crm/
    │   ├── README.md
    │   ├── operation-logs/
    │   └── scripts, schemas, data, etc.
    └── marketing-reports/
        ├── README.md
        └── operation-logs/
```

## README.md

Every program has a `README.md` at its root — the complete operating manual. Cover what the program does, what external resources it uses (database tables, storage buckets, API endpoints, identifiers), how scripts work, and how to recover from failures.

Write it as if a future version of yourself will read it with zero prior context — because that's exactly what happens when you wake up on a schedule or in a new conversation. Update it whenever you change the program.

## operation-logs/

After each run, append a log entry under `operation-logs/` — what happened, what succeeded, what failed, what you did about it. Use dated files (e.g. `2026-04-03.md`) or a rolling log. These logs help you diagnose issues on later runs and give the user visibility.

## Rediscovery

When you wake up with no context about what programs exist, this is your first step:

1. `listFiles("programs/")` — see what programs are available
2. `readFile("programs/<name>/README.md")` — understand any program fully

## Cloud resources

If you have skills or connections for cloud providers, databases, or APIs, use them to provision resources your programs need — databases, storage buckets, queues, etc. Always record resource details (names, identifiers, regions, endpoints) in the program's README so you can find them again later.
