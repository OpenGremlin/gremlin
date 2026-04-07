---
name: basic-programming
description: >-
  How to write and organize code in the workspace — project layout,
  README discipline, operation logging, and rediscovery patterns. Read
  this skill before writing scripts, building automations, or doing any
  coding work that should survive across conversations.
metadata:
  version: 1.0.0
  displayName: Basic Programming
  author: gremlin
  category: workflow
  icon: file-code
  tags: [coding, workspace, automation, persistence]
---

# Basic Programming

When you write code in the workspace, organize it as **programs** — persistent, self-contained projects under `programs/` that survive across conversations. This is how you automate recurring work: CRM tracking, report generation, data pipelines, email triage, scrapers, schedulers, and so on. Even one-off scripts usually belong inside a program rather than at the workspace root.

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
