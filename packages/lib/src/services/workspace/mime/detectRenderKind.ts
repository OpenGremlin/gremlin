export type RenderKind =
  | "image"
  | "document"
  | "code"
  | "audio"
  | "video"
  | "pdf"
  | "unknown";

const CODE_EXTENSIONS = new Set([
  ".js",
  ".mjs",
  ".cjs",
  ".jsx",
  ".ts",
  ".tsx",
  ".json",
  ".jsonl",
  ".xml",
  ".yaml",
  ".yml",
  ".toml",
  ".ini",
  ".env",
  ".sh",
  ".bash",
  ".zsh",
  ".fish",
  ".py",
  ".rb",
  ".java",
  ".kt",
  ".go",
  ".rs",
  ".c",
  ".cpp",
  ".h",
  ".hpp",
  ".cs",
  ".swift",
  ".php",
  ".r",
  ".sql",
  ".graphql",
  ".gql",
  ".lua",
  ".pl",
  ".ex",
  ".exs",
  ".erl",
  ".hs",
  ".scala",
  ".clj",
  ".dart",
  ".vue",
  ".svelte",
  ".html",
  ".htm",
  ".css",
  ".dockerfile",
  ".tf",
  ".proto",
  ".csv",
  ".mmd",
  ".mermaid",
  ".scss",
  ".sass",
  ".less",
  ".styl",
  ".hbs",
  ".handlebars",
  ".ejs",
  ".pug",
  ".liquid",
  ".twig",
  ".jsonc",
  ".json5",
  ".ndjson",
  ".tsv",
  ".diff",
  ".patch",
  ".nix",
  ".zig",
  ".jl",
  ".ml",
  ".mli",
  ".groovy",
  ".gradle",
  ".astro",
  ".rkt",
  ".lisp",
  ".scm",
  ".fs",
  ".fsx",
  ".v",
  ".sv",
  ".nim",
  ".cr",
  ".d",
  ".cmake",
  ".mk",
  ".makefile",
  ".tfvars",
  ".log",
  ".procfile",
  ".gitignore",
  ".gitattributes",
  ".dockerignore",
  ".editorconfig",
  ".rst",
  ".adoc",
  ".asciidoc",
]);

// `.mdx` is MDX — valid markdown with optional JSX. Route it through the
// document renderer; any JSX will surface as inline text.
const DOCUMENT_EXTENSIONS = new Set([".md", ".markdown", ".txt", ".mdx"]);

export function detectRenderKind(mime: string | null, ext: string): RenderKind {
  const lower = ext.toLowerCase();

  if (lower === ".pdf") return "pdf";
  if (DOCUMENT_EXTENSIONS.has(lower)) return "document";
  if (CODE_EXTENSIONS.has(lower)) return "code";

  if (mime) {
    if (mime.startsWith("image/")) return "image";
    if (mime.startsWith("audio/")) return "audio";
    if (mime.startsWith("video/")) return "video";
  }

  return "unknown";
}
