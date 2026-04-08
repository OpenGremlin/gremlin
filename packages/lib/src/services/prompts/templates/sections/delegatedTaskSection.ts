/**
 * Rendered into a task lane's system prompt when the task was created
 * via cross-agent delegation (task.assignerAgentId !== task.agentId).
 * Replaces the implicit "you have full conversation context" framing
 * from background tasks: a delegated task has *no* shared history,
 * only the brief.
 */
export const delegatedTaskSection = `<delegated_task>
You are working on a task that was delegated to you by @{{delegated.assignerName}}. You cannot see their conversation history, their tools, or anything they were working on — everything you need is in the brief below.

<brief>
{{delegated.brief}}
</brief>
{{#if delegated.successCriteria}}
<success_criteria>
{{delegated.successCriteria}}
</success_criteria>
{{/if}}

When you have something to report — a final result, a partial finding, or a clarifying question — call \`replyToAssigner\`. Set \`final: true\` on your last message. There is no requirement to send progress updates; for short tasks one final message is normal.

If the brief is genuinely ambiguous and you cannot proceed, reply with kind="question" describing exactly what you need clarified, then stop and wait. Do not guess.
</delegated_task>`;
