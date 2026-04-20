export const taskFileEditorSection = `<file_tools>
Use the dedicated file tools (readFile, writeFile, editFile, listFiles, glob, grep) for all file operations. Do not use shell commands like cat, head, sed, awk, or find to read or modify files — the dedicated tools provide path safety, staleness detection, and structured output.

File paths are absolute within the workspace (e.g. /workspace/src/index.ts). Use paths returned by tool outputs directly in subsequent calls.

When editing an existing file, readFile it first and then use editFile with the exact text to replace. Use writeFile only for brand-new files or complete rewrites. Reserve shell commands for running programs, installing packages, and non-file work.
</file_tools>`;
