# Gremlin Admin — Architecture Guide

## Overview

Mobile-first responsive React app for managing Gremlin agents, jobs, integrations, and skills.
Main navigation tabs: Home, Agents, Jobs. A Settings submenu provides access to Profile, Skills, Connect, and Files.

## Tech Stack

- React 19, TypeScript, Vite, Tailwind CSS v4
- React Router DOM v7 for routing
- No external UI library — hand-rolled components with Tailwind

## Directory Structure

```
apps/admin/src/
├── App.tsx                    # Root component
├── main.tsx                   # Entry point
├── index.css                  # Tailwind + global styles
├── types.ts                   # Shared domain types
├── components/
│   ├── RouterApp/             # BrowserRouter, AppShell layout, route definitions
│   │   └── index.tsx
│   ├── AgentsTab/             # Agents list + agent management
│   │   ├── index.tsx          # Agent list page
│   │   ├── AgentCard.tsx
│   │   ├── AgentForm.tsx
│   │   ├── NewAgentPage/
│   │   ├── AgentChatPage/     # Conversational agent view
│   │   │   ├── ChatHeader/
│   │   │   ├── ChatInputBar/
│   │   │   └── LogEntryView/  # Tool blocks, sandbox output, command results
│   │   └── AgentConfigPage/   # Agent settings (avatar, model, tools, voice)
│   │       ├── AvatarPicker/
│   │       ├── ModelPicker.tsx
│   │       ├── ToolsConfig.tsx
│   │       └── VoicePicker/
│   ├── TasksTab/              # Home tab — task feed
│   │   ├── index.tsx
│   │   └── TaskCard/
│   ├── TaskThreadPage/        # Full task thread detail view
│   │   └── index.tsx
│   ├── SchedulerTab/          # Jobs list + job management
│   │   ├── index.tsx
│   │   ├── JobForm.tsx
│   │   ├── NewJobPage/
│   │   └── JobDetailPage/
│   ├── FilesTab/              # File browser (under Settings)
│   │   ├── index.tsx
│   │   └── FileViewPage/
│   └── UserTab/               # Settings pages
│       ├── ProfilePage/
│       ├── SkillsPage/
│       ├── SkillDetailPage/
│       ├── SkillTemplatePage/
│       ├── IntegrationsPage/
│       ├── IntegrationDetailPage/
│       │   └── ModelCard.tsx
│       ├── ConnectionDetailPage/
│       └── NotificationsPage/
│           └── NotificationCard/
```

## Routing

```
/                              → redirect to /home
/home                          → TasksTab (task feed)

/agents                        → AgentsTab (agent list)
/agents/new                    → NewAgentPage
/agents/:id                    → AgentChatPage
/agents/:id/tasks/:taskId      → AgentChatPage (task-scoped)
/agents/:id/config             → AgentConfigPage

/jobs                          → SchedulerTab (job list)
/jobs/new                      → NewJobPage
/jobs/:id                      → JobDetailPage

/settings                      → redirect to /settings/profile
/settings/profile              → ProfilePage
/settings/skills               → SkillsPage
/settings/skills/:id           → SkillDetailPage
/settings/skills/catalog/:templateId → SkillTemplatePage
/settings/integrations         → IntegrationsPage
/settings/integrations/:id     → IntegrationDetailPage
/settings/connections/:id      → ConnectionDetailPage
/settings/files                → FilesTab
/settings/files/view           → FileViewPage

# Legacy redirects
/scheduler/*                   → /jobs
/files/*                       → /settings/files
/user/*                        → /settings/profile
```

## Component Conventions

1. **One component per file**, named export matching filename
2. **Page components** receive no props — they fetch their own data
3. **Card/list item components** receive typed props
4. **Shared components** — only truly reusable pieces
5. **Types** — domain types in `types.ts`, component-local types co-located
6. **Styling** — Tailwind utility classes, no CSS modules
7. **Data fetching** — components use `useQuery` to fetch live data from the GraphQL server

## Design Tokens (Tailwind classes)

- Background: `bg-neutral-950` (app), `bg-neutral-900` (cards)
- Text: `text-neutral-100` (primary), `text-neutral-400` (secondary)
- Accent: `text-indigo-400` (active tab, links)
- Border: `border-neutral-800`
- Rounded: `rounded-xl` (cards), `rounded-full` (avatars, badges)
- Spacing: `p-4` standard padding, `gap-3` between list items
- Max width: `max-w-lg mx-auto` to constrain on desktop

## Navigation

Left icon rail with three main tabs: Home, Agents, Jobs. A Settings icon at the bottom opens a secondary icon rail with Profile, Skills, Connect, and Files. Active tab is highlighted with the accent color. Icons from `lucide-react`.
