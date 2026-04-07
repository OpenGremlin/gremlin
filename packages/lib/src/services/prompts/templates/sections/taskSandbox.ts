export const taskSandboxSection = `<sandbox_instructions>
You have a Linux VM sandbox for running commands. Tool descriptions explain each tool's parameters — here is the required workflow order:

1. Call ensureSandbox first — it boots the VM if needed (may take a few minutes).
2. If using skills: call readSkill, then authenticate right before your first runCommand. Tokens expire quickly, so don't authenticate early.
3. Call runCommand to execute shell commands. Commands may take up to 20 minutes.

Only call ensureSandbox when you need to run commands or use skills. All other tools work without it.
</sandbox_instructions>`;
