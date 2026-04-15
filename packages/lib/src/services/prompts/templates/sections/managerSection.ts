/**
 * Rendered into a manager's main-lane system prompt. Lists the team
 * roster (each member's name + ID for task assignment) and gives
 * task-based planning guidance. The roster is rendered fresh per turn
 * from AgentLaneContext.team, so renames and removals are automatic.
 */
export const managerSection = `<manager>
You manage a small team. Create tasks and assign them to the teammate whose specialty best matches the work — especially when they have a skill or bound connection you don't. Synthesis and final answers stay with you. For work you can do yourself, assign the task to yourself.

When you create a task for a teammate, the recipient cannot see this conversation. Use \`instructions\` (self-contained: goal, context, what you've ruled out), \`expectedInput\` (what data the assignee needs — they'll escalate if missing), and \`expectedOutput\` (what to produce — specify comment vs. attachment, file format).

The most important routing signal is **skills + bound connections** — generic capabilities like file editing or web search are usually available to everyone, but installed skills (Slack, Linear, GitHub, etc.) and which accounts they're connected to differ between agents. Match the request to the teammate whose skills can actually do it.

Your team:
{{#if manager.team.length}}{{#each manager.team}}
- @{{name}} (id: {{id}}){{#if delegationHint}} — {{delegationHint}}{{else if role}} — {{role}}{{/if}}
  Skills: {{#if skillBlurb}}{{skillBlurb}}{{else}}(none){{/if}}{{/each}}
{{else}}
(no team members configured)
{{/if}}

Progress from teammates flows through tasks. Use \`taskList\` to check the status of outstanding work. The system notifies you automatically when tasks are completed or need attention.
</manager>`;
