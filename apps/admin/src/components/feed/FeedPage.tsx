import type { FeedItem } from "../../types";
import { PageHeader } from "../../shared/PageHeader";
import { FeedCard } from "./FeedCard";

export const mockFeedItems: FeedItem[] = [
  {
    id: "feed-1",
    agentName: "Atlas",
    avatarState: "dormant",
    title: "Weekly Market Research Report",
    summary:
      "Compiled analysis of Q4 market trends across SaaS verticals. Key findings include a 12% increase in PLG adoption and shifting budget allocations toward AI tooling.",
    body: `## Weekly Market Research Report

Analyzed 47 sources across industry publications, earnings transcripts, and analyst reports for the week of Feb 17-21.

### Key Findings

**PLG Adoption Accelerating**
Product-led growth motions saw a 12% quarter-over-quarter increase in adoption among mid-market SaaS companies. Companies with PLG motions reported 23% higher net revenue retention compared to sales-led peers.

**AI Tooling Budget Shifts**
Enterprise IT budgets are reallocating 8-15% of existing tooling spend toward AI-native solutions. The majority of this is coming from reductions in legacy analytics and BI platforms.

**Developer Experience as Differentiator**
Three of the five fastest-growing devtool companies cited developer experience improvements as their primary growth driver, outweighing pricing and feature completeness.

### Recommendations

- Prioritize PLG metrics in the next product review cycle
- Evaluate current BI stack for potential AI-native replacements
- Schedule developer experience audit for Q2`,
    category: "research",
    completedAt: "2026-02-28T07:30:00Z",
  },
  {
    id: "feed-2",
    agentName: "Miko",
    avatarState: "active",
    title: "Database Migration Completed",
    summary:
      "Successfully migrated user_sessions table to the new partitioned schema. Zero downtime achieved with shadow-write strategy over a 4-hour window.",
    body: `## Database Migration: user_sessions

Migration of the user_sessions table to a time-partitioned schema has been completed successfully.

### Migration Details

**Strategy:** Shadow-write with gradual cutover
**Duration:** 4 hours 12 minutes
**Downtime:** Zero
**Records migrated:** 14.2M rows

### Performance Impact

Query latency for session lookups improved by 340ms on average (p95). The new partitioned schema allows automatic archival of sessions older than 90 days, reducing active table size by approximately 60%.

### Verification

- All integration tests passing against new schema
- Read/write consistency verified across 3 replicas
- Rollback procedure tested and confirmed operational
- Monitoring dashboards updated with new partition metrics`,
    category: "task",
    completedAt: "2026-02-28T04:15:00Z",
  },
  {
    id: "feed-3",
    agentName: "Sentry",
    avatarState: "attentive",
    title: "Anomaly Detected: API Latency Spike",
    summary:
      "Detected unusual latency increase on /api/v2/search endpoint. P99 jumped from 180ms to 920ms between 02:00-02:45 UTC. Root cause identified as cache invalidation storm.",
    body: `## Monitoring Alert: API Latency Anomaly

An unusual latency spike was detected and automatically investigated.

### Timeline

- **02:00 UTC** - P99 latency on /api/v2/search began climbing
- **02:12 UTC** - Alert threshold breached (>500ms p99)
- **02:15 UTC** - Automated investigation initiated
- **02:28 UTC** - Root cause identified
- **02:45 UTC** - Latency returned to baseline after cache rebuild

### Root Cause

A scheduled cache invalidation job ran concurrently with a bulk import operation, causing a cache stampede. Approximately 12,000 cache keys were invalidated simultaneously, forcing cold reads against the primary database.

### Impact

- 847 requests experienced degraded latency
- No requests failed (all completed within timeout)
- No user-facing errors reported

### Recommended Fix

Implement staggered cache invalidation with jitter to prevent thundering herd. A draft PR has been prepared with the proposed changes.`,
    category: "monitor",
    completedAt: "2026-02-28T02:50:00Z",
  },
  {
    id: "feed-4",
    agentName: "Scribe",
    avatarState: "dormant",
    title: "Sprint Retrospective Summary",
    summary:
      "Generated retrospective report for Sprint 24. Team velocity increased 15% with improved estimation accuracy. Three action items identified for next sprint.",
    body: `## Sprint 24 Retrospective Summary

Automatically generated from team standup notes, PR activity, and ticket resolution data.

### Velocity

- **Planned:** 34 story points
- **Completed:** 38 story points (+15% vs Sprint 23)
- **Estimation accuracy:** 89% (up from 76%)

### What Went Well

1. Pair programming sessions reduced PR review cycle time by 40%
2. New CI pipeline cut build times from 12min to 4min
3. Zero production incidents during the sprint

### Areas for Improvement

1. Documentation updates lagging behind feature development
2. Three tickets were blocked for >2 days waiting on external API access
3. Test coverage dropped 2% in the payments module

### Action Items

- [ ] Schedule documentation sprint for next cycle
- [ ] Set up sandbox credentials for external API testing
- [ ] Add coverage gates for payments module in CI`,
    category: "report",
    completedAt: "2026-02-27T18:00:00Z",
  },
  {
    id: "feed-5",
    agentName: "Atlas",
    avatarState: "waiting",
    title: "Competitor Feature Analysis",
    summary:
      "Tracked 8 competitor product updates this week. Notable launches include real-time collaboration in Acme Pro and a new API gateway offering from NovaTech.",
    body: `## Competitor Feature Tracker — Week of Feb 21

Monitored product changelog pages, press releases, and social channels for 8 tracked competitors.

### Notable Updates

**Acme Pro v4.2**
Launched real-time collaboration with presence indicators and live cursors. Currently limited to their Enterprise tier. Early user feedback is positive but notes occasional sync conflicts with large documents.

**NovaTech API Gateway**
New standalone API gateway product announced. Features include automatic rate limiting, request transformation, and built-in analytics. Pricing undercuts existing solutions by roughly 30%.

**Orion Dashboard**
Released AI-powered anomaly detection for their monitoring dashboards. Uses a proprietary model trained on customer infrastructure patterns. Free for existing Pro subscribers.

### Market Implications

The trend toward AI-augmented features continues to accelerate. All three launches include some form of intelligent automation. Companies without an AI story in their product roadmap risk falling behind in competitive positioning.

### No Significant Changes

- Prism Analytics
- QuickDeploy
- StackForge
- Nimbus Cloud
- DataBridge`,
    category: "research",
    completedAt: "2026-02-27T14:30:00Z",
  },
  {
    id: "feed-6",
    agentName: "Miko",
    avatarState: "active",
    title: "Automated Dependency Updates",
    summary:
      "Reviewed and merged 12 dependency updates. All tests passing. Two packages had breaking changes requiring minor code adjustments in the auth module.",
    body: `## Dependency Update Batch — February 28

Automated review and merge of pending dependency updates across the monorepo.

### Summary

- **Total packages updated:** 12
- **Auto-merged (no breaking changes):** 10
- **Required manual adjustments:** 2
- **All CI checks:** Passing

### Breaking Changes Resolved

**@auth/core 5.2.0 -> 6.0.0**
The session callback signature changed to async. Updated 3 files in the auth module to use the new async pattern. No functional behavior change.

**zod 3.22 -> 3.23**
The .transform() method now requires explicit output type annotation in strict mode. Updated 7 schema definitions in the validation layer.

### Packages Updated

- react 19.0.1 -> 19.0.2
- typescript 5.7.2 -> 5.7.3
- @auth/core 5.2.0 -> 6.0.0
- zod 3.22.0 -> 3.23.0
- vite 6.1.0 -> 6.1.1
- tailwindcss 4.1.0 -> 4.1.1
- eslint 9.20.0 -> 9.21.0
- prettier 3.5.0 -> 3.5.1
- vitest 3.0.5 -> 3.0.6
- @types/node 22.12.0 -> 22.13.0
- drizzle-orm 0.39.0 -> 0.39.1
- hono 4.7.0 -> 4.7.2`,
    category: "task",
    completedAt: "2026-02-27T10:45:00Z",
  },
];

export function FeedPage() {
  return (
    <div className="min-h-screen bg-neutral-950">
      <PageHeader title="Feed" />
      <div className="flex flex-col gap-3 px-4 pb-24">
        {mockFeedItems.map((item) => (
          <FeedCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}
