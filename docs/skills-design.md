# Skills

## Purpose

Gremlin agents use CLI-based skills to interact with external services. This document specifies how skills are defined, discovered, assigned, initialized, and executed.

Agentic systems are moving toward CLI-based task execution for flexibility and inference token efficiency. Skills make this process safer, more structured, and more observable by giving users fine-grained control over authentication and minimizing the surface risk for auth tokens.

The skill system is compatible with the [Agent Skills](https://agentskills.io/specification) and [OpenClaw](https://docs.openclaw.ai/tools/skills) specifications, extended with connection-based auth, idempotent install scripts, and on-demand initialization.

## Skill Files

Each skill is a directory containing a `SKILL.md` file with YAML frontmatter and a Markdown body:

```
packages/lib/skills/
├── github/
│   └── SKILL.md
├── google-workspace/
│   └── SKILL.md
├── filesystem/
│   └── SKILL.md
└── code-review/
    └── SKILL.md
```

Core skills live in the monorepo at `packages/lib/skills/<skill-dir>/SKILL.md`. At deploy time, they are synced to S3 where the server reads them at runtime. See [Storage](#storage) for details.

### Why file-based

- Closer to the Agent Skills / OpenClaw standard
- Practical to edit as Markdown, supports supplemental files (references, scripts, assets)
- Opens the door to community-contributed skills via PRs
- Agent instructions are naturally Markdown, not JSON strings

## SKILL.md Schema

### Frontmatter

```yaml
---
# === Required ===
name: Google Workspace                # Display name
description: >-                       # What the skill does and when to use it (max 1024 chars)
  Manage Gmail, Drive, Calendar, Sheets, Docs, Chat,
  and more via the Google Workspace CLI.
version: 1.0.0                        # Semver

# === Optional metadata ===
author: gremlin                       # Who maintains this skill
category: productivity                # developer | productivity | web | data
icon: google                          # Icon key for the UI
tags: [google, email, calendar, drive] # Searchable tags

# === Auth ===
connections:                          # Connections the skill needs (empty or omitted if none)
  - provider: google                  # References IntegrationProvider.id
    env:                              # Maps sandbox env vars to connection fields
      GOOGLE_WORKSPACE_CLI_TOKEN: accessToken
    reason: >-                        # Shown to user when assigning the skill
      Access Drive, Gmail, Calendar, and other Workspace services.
    requestedScopes:                  # Scopes the skill would like (advisory, user decides)
      - gmail.readonly
      - gmail.send
      - documents.readonly
    optional: false                   # Whether the skill can function without this connection

# === Setup ===
install: |                            # Shell script, must be idempotent
  npm install -g @googleworkspace/cli

---
```

The skill's unique identifier is derived from its directory name (e.g. `google-workspace/SKILL.md` → id `google-workspace`). There is no `id` field in the frontmatter.

### Frontmatter fields

| Field | Required | Type | Description |
|-------|----------|------|-------------|
| `name` | Yes | `string` | Human-readable display name. Max 64 characters. |
| `description` | Yes | `string` | What the skill does and when to use it. Max 1024 characters. |
| `version` | Yes | `string` | Semver version string. |
| `author` | No | `string` | Maintainer or organization. |
| `category` | No | `string` | One of: `developer`, `productivity`, `web`, `data`. |
| `icon` | No | `string` | Icon key for the UI. |
| `tags` | No | `string[]` | Searchable tags for discovery. |
| `connections` | No | `Connection[]` | Auth connections the skill needs. See below. |
| `install` | No | `string` | Idempotent shell script to install dependencies. |

### Connection fields

| Field | Required | Type | Description |
|-------|----------|------|-------------|
| `provider` | Yes | `string` | References an `IntegrationProvider.id`. |
| `env` | Yes | `Record<string, string>` | Maps environment variable names to connection fields (e.g. `accessToken`). |
| `reason` | Yes | `string` | Shown to the user when assigning the skill. Explains why the connection is needed. |
| `requestedScopes` | No | `string[]` | Scopes the skill would like. Advisory — the user controls what is granted. |
| `optional` | No | `boolean` | Whether the skill can function without this connection. Default `false`. |

### Body

The Markdown body after the frontmatter contains the skill instructions. This is injected into the agent's conversation context when the skill is initialized — not at startup. Write whatever helps the agent use the skill effectively:

- CLI syntax and examples
- Available commands or tool names
- Common patterns and edge cases
- Safety rules (what to confirm before executing)

Keep the body under 500 lines. For detailed reference material, use supplemental files in the skill directory.

### Supplemental files

Skills can include additional files following the Agent Skills convention:

```
google-workspace/
├── SKILL.md              # Required: metadata + instructions
├── scripts/              # Optional: executable scripts
├── references/           # Optional: detailed documentation
└── assets/               # Optional: templates, data files
```

These are uploaded to S3 alongside `SKILL.md` and are not loaded automatically. The skill body can reference them by relative path. Loading supplemental files on demand via a tool call is out of scope for this iteration — the agent would need a `read_skill_file(skillId, path)` tool in the future.

## Examples

### CLI tool (Google Workspace)

```markdown
---
name: Google Workspace
description: >-
  Manage Gmail, Drive, Calendar, Sheets, Docs, Chat,
  and more via the Google Workspace CLI.
version: 1.0.0
author: gremlin
category: productivity
icon: google
tags: [google, email, calendar, drive]

connections:
  - provider: google
    env:
      GOOGLE_WORKSPACE_CLI_TOKEN: accessToken
    reason: Access Drive, Gmail, Calendar, and other Workspace services.
    requestedScopes: [gmail.readonly, gmail.send, documents.readonly]

install: |
  npm install -g @googleworkspace/cli

---

# Google Workspace

You have access to Google Workspace via the `gws` CLI.

## Syntax

`gws <service> <resource> <method> [flags]`

## Services

gmail, drive, calendar, sheets, docs, chat, meet, tasks, keep, forms, slides, people, classroom.

## Key Flags

- `--params '{...}'` — query/URL parameters
- `--json '{...}'` — request body
- `--page-all` — auto-paginate (NDJSON output)
- `--dry-run` — preview without calling API
- `--format json|table|yaml|csv`

## Discovery

- `gws <service> --help` — browse resources
- `gws schema <service>.<resource>.<method>` — inspect parameters

## Rules

- Always confirm destructive actions (deleting files, sending emails) with the user.
- Never output secrets or tokens directly.
```

### MCP server via mcporter (GitHub)

```markdown
---
name: GitHub
description: Manage repositories, issues, and pull requests.
version: 1.0.0
author: gremlin
category: developer
icon: github
tags: [developer, git, code]

connections:
  - provider: github
    env:
      GITHUB_PERSONAL_ACCESS_TOKEN: accessToken
    reason: Authenticate with GitHub to access repositories and issues.
    requestedScopes: [repo]

install: |
  npm install -g mcporter @modelcontextprotocol/server-github
  mcporter add --stdio "npx @modelcontextprotocol/server-github" --name github

---

# GitHub

Tools are available via mcporter.

## Usage

- List tools: `mcporter list github`
- Call a tool: `mcporter call github.<tool_name> key:value key2:'longer value'`

## Rules

- Always confirm destructive actions (force-push, delete branch) with the user.
```

### Knowledge-only (Code Review)

```markdown
---
name: Code Review
description: >-
  Adds code review best practices to the agent's context.
  Use when reviewing pull requests or code changes.
version: 1.0.0
author: gremlin
category: developer
icon: code
tags: [developer, code-quality]

---

# Code Review

When reviewing code, follow these best practices:

1. Check for correctness, readability, and maintainability.
2. Look for potential bugs, security vulnerabilities, and performance issues.
3. Suggest improvements with clear explanations.
4. Be constructive and respectful in feedback.
5. Prioritize issues by severity: critical bugs > security > performance > style.
```

## Architecture

### Progressive Disclosure

Skills use a three-tier loading model to manage context window usage:

1. **Catalog** (~100 tokens per skill): The server reads frontmatter from all `SKILL.md` files to build the catalog. Served via GraphQL for the UI and included as summaries in the agent's system prompt.
2. **Initialization** (<5000 tokens per skill): When an agent decides to use a skill, it calls `initialize_skill`. The server runs the install script, sets up auth, and returns the full `SKILL.md` body in the tool response. This call blocks the agent until complete.
3. **Supplemental files** (out of scope): Future iteration. The agent would be able to read additional files from the skill directory via a dedicated tool.

The agent's system prompt only contains skill names and descriptions — never the full body. This keeps the prompt lean even with many skills assigned.

### Skill Assignment

Skills are assigned to individual agents, not installed globally. When assigning a skill to an agent:

1. The user selects a skill from the catalog.
2. If the skill has `connections`, the user selects which connection to bind for each required provider.
3. The assignment is stored as an `AgentSkill` entity in DynamoDB (see [Data Model](#data-model)).

A skill can be assigned to multiple agents. Each assignment has its own connection bindings — two agents can use the same skill with different connections.

### Initialization Flow

When the agent calls `initialize_skill(skillId)`:

1. **Validate**: The server looks up the skill in S3. If the skill no longer exists (e.g. removed from core in a deploy), the agent receives an error: "Skill `<skillId>` is no longer available."
2. **Auth setup**: For each connection binding on the `AgentSkill` record, the server refreshes the access token if necessary and sets the mapped environment variables in the sandbox.
3. **Install**: The server runs the `install` script in the sandbox. This must be idempotent — it will run on every initialization. Package managers like npm handle this naturally by skipping already-installed packages. If install fails, the agent receives the error output.
4. **Return instructions**: The server reads the `SKILL.md` body (everything after frontmatter) and returns it to the agent as the tool response.

If any step fails (skill not found, connection revoked, token refresh failed, install error), the agent is notified with a clear error message explaining what went wrong.

### Token Refresh

If a token expires mid-task, the agent can call `refresh_skill_token(skillId, provider)`. The server refreshes the token and re-sets the environment variable in the sandbox. The tool response confirms success or reports the error — it never returns the actual token value.

### Data Model

#### AgentSkill Entity

A new DynamoDB Toolbox entity that stores the assignment of a skill to an agent, along with connection bindings.

```
pk: AGENT#<agentId>
sk: AGENT_SKILL#<skillId>
_et: AgentSkill
```

| Attribute | Type | Description |
|-----------|------|-------------|
| `agentId` | `string` | The agent this skill is assigned to. |
| `skillId` | `string` | The skill directory name (matches S3 prefix). |
| `connectionBindings` | `string \| null` | JSON string mapping `providerId` → `connectionId`, e.g. `{"github":"conn-123"}`. |
| `assignedAt` | `string` | ISO timestamp of when the skill was assigned. |

Key design:
- **pk** is `AGENT#<agentId>` so all skills for an agent can be queried in a single `Query` with sk prefix `AGENT_SKILL#`.
- **skillId** references a directory in S3, not a DynamoDB record. The skill's metadata is always read from S3. If the skill is removed from S3, the assignment becomes orphaned — the server handles this gracefully (see [Removed Skills](#removed-skills)).

### Storage

Skills are stored in a single S3 bucket with two top-level prefixes:

```
s3://gremlin-skills/
├── core/                     # Managed by CDK BucketDeployment, replaced on every deploy
│   ├── github/
│   │   └── SKILL.md
│   ├── google-workspace/
│   │   ├── SKILL.md
│   │   └── references/
│   │       └── gmail.md
│   └── ...
└── user/                     # Future: user-installed skills (out of scope)
    └── <skillId>/
        └── SKILL.md
```

**Core skills** (`core/`): Authored in the monorepo at `packages/lib/skills/`. Deployed to S3 using the CDK `BucketDeployment` construct, which handles atomic upload and cleanup. The `core/` prefix is fully replaced on every deploy — no drift, no orphaned skills.

**User skills** (`user/`): Reserved for future use. User-installed skills would be uploaded here by skill ID. The server uses the same scanning and loading logic for both prefixes — the only difference is lifecycle (core is CDK-managed, user would be API-managed).

### Server: Catalog Scanning

The server scans S3 to build the skill catalog. It lists objects under `core/` (and eventually `user/`), reads each `SKILL.md`, and parses the YAML frontmatter.

The scan result is cached in memory with a 1-minute TTL so the catalog doesn't require an S3 list on every GraphQL request.

1. `ListObjectsV2` with prefix `core/` and delimiter `/` to discover skill directories
2. For each directory, `GetObject` on `<prefix>/SKILL.md`
3. Parse YAML frontmatter, derive `id` from the directory name
4. Skip files with parse errors (log a warning)
5. Return parsed frontmatter via the `skillTemplates` GraphQL query

When initializing a skill, the server reads the full `SKILL.md` from S3 (body included) and returns the body to the agent.

### Removed Skills

If a core skill is removed in a deploy, agents that have it assigned will encounter it as missing:

- **At runtime**: `initialize_skill` returns an error — "Skill `<skillId>` is no longer available." The agent can proceed with its other skills.
- **In the UI**: The catalog page won't show the skill since there's nothing to scan. The agent config page can show orphaned assignments as "skill not found" with an option to remove.
- **No cascading deletes**: `AgentSkill` records are not automatically cleaned up when a skill disappears from S3. They are inert and can be removed manually or via a future cleanup job.

## UX

### Settings > Skills (Catalog)

The catalog page at `/settings/skills` is read-only. It displays all available skill templates grouped by category, with search. Each skill shows:

- Name, description, icon
- Category and tags
- Which agents have the skill assigned

This page is a browsing experience. Future iterations will support installing community skills.

### Agent Config > Skills

The agent configuration page includes a skills section where users:

1. Add skills from the catalog
2. Select connections for each required provider
3. Remove assigned skills

The UI shows connection status (connected, disconnected, token expired) for each binding.

## Infrastructure

### S3 Bucket

The skills S3 bucket configuration:

- Versioning enabled (allows rollback of core skill changes)
- Server-side encryption (AES-256)
- No public access
- Lifecycle rule: delete non-current versions after 30 days

The server's IAM role needs `s3:GetObject` and `s3:ListBucket` on the bucket.

### CDK BucketDeployment

Core skills are deployed using the CDK `BucketDeployment` construct, which:

- Uploads the contents of `packages/lib/skills/` to the `core/` prefix
- Uses `prune: true` to remove files in S3 that no longer exist in the source
- Handles the upload atomically as part of the CDK deploy

```typescript
new s3deploy.BucketDeployment(this, "CoreSkills", {
  sources: [s3deploy.Source.asset("../lib/skills")],
  destinationBucket: skillsBucket,
  destinationKeyPrefix: "core/",
  prune: true,
});
```

The bucket name is passed to the server as an environment variable (`SKILLS_BUCKET`).

