# Gremlin Admin — Architecture Guide

## Overview

Mobile-first responsive React app for managing Gremlin agents, jobs, integrations, and skills.
Four tabs: Feed, Scheduler, Integrations, Skills.

## Tech Stack

- React 19, TypeScript, Vite, Tailwind CSS v4
- React Router DOM v7 for routing
- No external UI library — hand-rolled components with Tailwind

## Directory Structure

```
apps/admin/src/
├── App.tsx                    # Router setup + TabShell
├── main.tsx                   # Entry point
├── index.css                  # Tailwind + global styles
├── types.ts                   # Shared domain types
├── components/
│   ├── TabShell.tsx           # Bottom tab bar + page slot layout
│   ├── feed/
│   │   ├── FeedPage.tsx       # Scrollable job feed
│   │   ├── FeedCard.tsx       # Individual job card (avatar, summary, timestamp)
│   │   └── FeedDetailPage.tsx # Full detail view (rendered markdown, etc.)
│   ├── scheduler/
│   │   ├── SchedulerPage.tsx  # List of agent jobs with status badges
│   │   └── JobDetailPage.tsx  # Recurrence + prompt description
│   ├── integrations/
│   │   ├── IntegrationsPage.tsx   # Grid of linked services
│   │   └── IntegrationDetailPage.tsx  # Service permissions list
│   └── skills/
│       ├── SkillsPage.tsx     # Installed skills + search
│       └── SkillDetailPage.tsx    # Skill detail view
└── shared/
    ├── Avatar.tsx             # Small agent avatar (reuse dust-sprite style)
    ├── Badge.tsx              # Status badge (running, completed, etc.)
    ├── BackButton.tsx         # Detail page back navigation
    └── PageHeader.tsx         # Consistent page title bar
```

## Routing

```
/                → redirect to /feed
/feed            → FeedPage
/feed/:id        → FeedDetailPage
/scheduler       → SchedulerPage
/scheduler/:id   → JobDetailPage
/integrations    → IntegrationsPage
/integrations/:id → IntegrationDetailPage
/skills          → SkillsPage
/skills/:id      → SkillDetailPage
```

## Component Conventions

1. **One component per file**, named export matching filename
2. **Page components** receive no props — they own their mock data for now
3. **Card/list item components** receive typed props
4. **Shared components** live in `shared/` — only truly reusable pieces
5. **Types** — domain types in `types.ts`, component-local types co-located
6. **Styling** — Tailwind utility classes, no CSS modules
7. **No context/state management** — just useState with mock data for now

## Design Tokens (Tailwind classes)

- Background: `bg-neutral-950` (app), `bg-neutral-900` (cards)
- Text: `text-neutral-100` (primary), `text-neutral-400` (secondary)
- Accent: `text-indigo-400` (active tab, links)
- Border: `border-neutral-800`
- Rounded: `rounded-xl` (cards), `rounded-full` (avatars, badges)
- Spacing: `p-4` standard padding, `gap-3` between list items
- Max width: `max-w-lg mx-auto` to constrain on desktop

## Mock Data

Each page owns its own mock data array at the top of the page file.
Use the types from `types.ts` for consistency.

## Tab Bar

Fixed bottom bar with 4 icons+labels. Active tab highlighted with accent color.
Tabs: Feed, Scheduler, Integrations, Skills.
Use simple inline SVG icons (no icon library).
