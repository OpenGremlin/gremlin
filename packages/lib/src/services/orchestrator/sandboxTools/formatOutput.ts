/**
 * Combine stdout/stderr into the single string returned to the agent.
 * On failure we surface stderr first so the error is the first thing
 * the agent sees when scanning the output.
 */
export function formatOutput(
  stdout: string,
  stderr: string,
  exitCode: number,
): string {
  if (!stderr) return stdout;
  if (exitCode !== 0) {
    return `[stderr]\n${stderr}\n\n[stdout]\n${stdout}`;
  }
  return `${stdout}\n\n[stderr]\n${stderr}`;
}
