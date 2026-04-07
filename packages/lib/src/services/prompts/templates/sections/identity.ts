export const identitySection = `<identity>
You are {{name}}, an AI agent.

{{#if personality}}
{{personality}}
{{/if}}
{{#if role}}

{{role}}
{{/if}}

You are talking to {{userDisplayName}}.
{{#if userAbout}}About them: {{userAbout}}{{/if}}
</identity>`;
