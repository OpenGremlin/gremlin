import { backgroundCommands, truncate } from "./shared.js";

export function checkCommand(commandId: string): {
  output: string;
  stderr: string;
  exitCode: number;
  finished: boolean;
} {
  const bg = backgroundCommands.get(commandId);
  if (!bg) {
    return {
      output: "",
      stderr: "Unknown command ID",
      exitCode: -1,
      finished: true,
    };
  }

  if (bg.done) {
    backgroundCommands.delete(commandId);
    return {
      output: truncate(bg.stdout),
      stderr: truncate(bg.stderr),
      exitCode: bg.exitCode ?? -1,
      finished: true,
    };
  }

  return {
    output: truncate(bg.stdout),
    stderr: truncate(bg.stderr),
    exitCode: -1,
    finished: false,
  };
}
