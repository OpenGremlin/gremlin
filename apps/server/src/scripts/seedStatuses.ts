import { PutItemCommand } from "dynamodb-toolbox/entity/actions/put";
import { StatusEntity } from "../resources/ddb/schema/status.js";

const statuses = [
  {
    id: "s1",
    agentId: "clawd",
    title: "Q1 Market Research Summary",
    summary: "Analyzed competitor landscape and market trends for Q1.",
    artifacts: [
      {
        type: "DOCUMENT",
        title: "Competitor Analysis",
        body: "## Key Findings\n\n- **Market share** shifted 3% toward mid-tier players\n- Three new entrants launched in the B2B segment\n- Pricing pressure increasing across all tiers\n\n### Recommendations\n\n1. Focus on differentiation through integrations\n2. Accelerate enterprise feature roadmap\n3. Consider strategic partnership opportunities",
      },
      {
        type: "DOCUMENT",
        title: "Trend Report",
        body: "## Emerging Trends\n\n- AI-assisted workflows gaining traction (40% YoY growth)\n- Consolidation of point solutions into platforms\n- Shift toward usage-based pricing models\n\n> \"The market is moving faster than expected toward integrated solutions.\" — Industry Analyst Report",
      },
    ],
    category: "RESEARCH",
    completedAt: "2026-02-28T14:30:00Z",
  },
  {
    id: "s2",
    agentId: "moss",
    title: "Weekly Infrastructure Report",
    summary: "All systems nominal. Latency improved 12% after CDN tuning.",
    artifacts: [
      {
        type: "DOCUMENT",
        title: "Performance Metrics",
        body: "## System Health\n\n| Metric | Value | Change |\n|--------|-------|--------|\n| Uptime | 99.98% | +0.01% |\n| P95 Latency | 142ms | -19ms |\n| Error Rate | 0.03% | -0.01% |\n\n### CDN Optimization\n\nTuned cache headers for static assets. Edge hit ratio improved from 87% to 94%.",
      },
    ],
    category: "MONITOR",
    completedAt: "2026-02-27T09:00:00Z",
  },
  {
    id: "s3",
    agentId: "flicker",
    title: "Onboarding Flow Redesign",
    summary: "Completed redesign of the user onboarding experience.",
    artifacts: [
      {
        type: "DOCUMENT",
        title: "Design Rationale",
        body: "## Goals\n\n- Reduce time-to-value from 8 minutes to under 3\n- Increase activation rate by 25%\n- Support both individual and team signups\n\n## Approach\n\nReplaced the multi-step wizard with a progressive disclosure pattern. Users see a minimal setup screen and unlock features as they explore.\n\n### Key Changes\n\n1. **Simplified signup** — name, email, one goal question\n2. **Interactive tutorial** — replaced static slides with in-app guidance\n3. **Smart defaults** — pre-configured workspace based on goal selection",
      },
      {
        type: "DOCUMENT",
        title: "Implementation Notes",
        body: "## Technical Details\n\n- New `OnboardingProvider` context wraps the app shell\n- Feature flags gate the progressive steps: `onboarding.v2.*`\n- Analytics events added for each milestone\n\n```tsx\n<OnboardingProvider>\n  <AppShell />\n</OnboardingProvider>\n```\n\n### Migration\n\nExisting users are marked as completed. New users enter the v2 flow automatically.",
      },
    ],
    category: "TASK",
    completedAt: "2026-02-26T16:45:00Z",
  },
  {
    id: "s4",
    agentId: "nyx",
    title: "Daily Digest — Feb 25",
    summary: "3 pull requests merged, 1 issue flagged for review.",
    artifacts: [
      {
        type: "DOCUMENT",
        title: "Activity Summary",
        body: "## Pull Requests Merged\n\n- **#412** — Fix pagination in dashboard table\n- **#415** — Add rate limiting to public API\n- **#418** — Update dependency versions\n\n## Flagged Issues\n\n- **#201** — Memory leak in WebSocket handler (assigned to backend team)\n  - Reproduced in staging, heap grows ~50MB/hour under load\n  - Likely caused by uncleared event listeners on disconnect",
      },
    ],
    category: "REPORT",
    completedAt: "2026-02-25T22:00:00Z",
  },
];

async function seed() {
  console.log("Seeding statuses...");

  for (const status of statuses) {
    await StatusEntity.build(PutItemCommand).item(status).send();
    console.log(`  Created: ${status.id} — ${status.title}`);
  }

  console.log(`Done. Seeded ${statuses.length} statuses.`);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
