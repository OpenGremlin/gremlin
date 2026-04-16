export type FileType =
  | "JAVASCRIPT"
  | "TYPESCRIPT"
  | "PYTHON"
  | "GO"
  | "RUST"
  | "JAVA"
  | "SWIFT"
  | "SHELL"
  | "WEB"
  | "CONFIG"
  | "CODE_OTHER"
  | "DOCUMENT"
  | "PDF"
  | "IMAGE"
  | "AUDIO"
  | "VIDEO"
  | "ARCHIVE"
  | "UNKNOWN";

const FILE_TYPE_MAP: Record<string, FileType> = {
  // JavaScript
  ".js": "JAVASCRIPT",
  ".mjs": "JAVASCRIPT",
  ".cjs": "JAVASCRIPT",
  ".jsx": "JAVASCRIPT",

  // TypeScript
  ".ts": "TYPESCRIPT",
  ".tsx": "TYPESCRIPT",

  // Python
  ".py": "PYTHON",

  // Go
  ".go": "GO",

  // Rust
  ".rs": "RUST",

  // Java / JVM
  ".java": "JAVA",
  ".kt": "JAVA",
  ".scala": "JAVA",

  // Swift / native mobile
  ".swift": "SWIFT",
  ".dart": "SWIFT",

  // Shell
  ".sh": "SHELL",
  ".bash": "SHELL",
  ".zsh": "SHELL",
  ".fish": "SHELL",

  // Web
  ".html": "WEB",
  ".htm": "WEB",
  ".css": "WEB",
  ".vue": "WEB",
  ".svelte": "WEB",
  ".scss": "WEB",
  ".sass": "WEB",
  ".less": "WEB",
  ".styl": "WEB",
  ".astro": "WEB",

  // Config
  ".json": "CONFIG",
  ".jsonl": "CONFIG",
  ".jsonc": "CONFIG",
  ".json5": "CONFIG",
  ".ndjson": "CONFIG",
  ".yaml": "CONFIG",
  ".yml": "CONFIG",
  ".toml": "CONFIG",
  ".ini": "CONFIG",
  ".env": "CONFIG",
  ".xml": "CONFIG",
  ".graphql": "CONFIG",
  ".gql": "CONFIG",
  ".proto": "CONFIG",
  ".tf": "CONFIG",
  ".tfvars": "CONFIG",
  ".dockerfile": "CONFIG",
  ".csv": "CONFIG",
  ".tsv": "CONFIG",
  ".procfile": "CONFIG",
  ".gitignore": "CONFIG",
  ".gitattributes": "CONFIG",
  ".dockerignore": "CONFIG",
  ".editorconfig": "CONFIG",

  // Code (other)
  ".rb": "CODE_OTHER",
  ".php": "CODE_OTHER",
  ".r": "CODE_OTHER",
  ".sql": "CODE_OTHER",
  ".lua": "CODE_OTHER",
  ".pl": "CODE_OTHER",
  ".ex": "CODE_OTHER",
  ".exs": "CODE_OTHER",
  ".erl": "CODE_OTHER",
  ".hs": "CODE_OTHER",
  ".clj": "CODE_OTHER",
  ".c": "CODE_OTHER",
  ".cpp": "CODE_OTHER",
  ".h": "CODE_OTHER",
  ".hpp": "CODE_OTHER",
  ".cs": "CODE_OTHER",
  ".wasm": "CODE_OTHER",
  ".mmd": "CODE_OTHER",
  ".mermaid": "CODE_OTHER",
  ".hbs": "CODE_OTHER",
  ".handlebars": "CODE_OTHER",
  ".ejs": "CODE_OTHER",
  ".pug": "CODE_OTHER",
  ".liquid": "CODE_OTHER",
  ".twig": "CODE_OTHER",
  ".nix": "CODE_OTHER",
  ".zig": "CODE_OTHER",
  ".jl": "CODE_OTHER",
  ".ml": "CODE_OTHER",
  ".mli": "CODE_OTHER",
  ".groovy": "CODE_OTHER",
  ".gradle": "CODE_OTHER",
  ".rkt": "CODE_OTHER",
  ".lisp": "CODE_OTHER",
  ".scm": "CODE_OTHER",
  ".fs": "CODE_OTHER",
  ".fsx": "CODE_OTHER",
  ".v": "CODE_OTHER",
  ".sv": "CODE_OTHER",
  ".nim": "CODE_OTHER",
  ".cr": "CODE_OTHER",
  ".d": "CODE_OTHER",
  ".cmake": "CODE_OTHER",
  ".mk": "CODE_OTHER",
  ".makefile": "CODE_OTHER",
  ".diff": "CODE_OTHER",
  ".patch": "CODE_OTHER",
  ".log": "CODE_OTHER",

  // Documents
  ".md": "DOCUMENT",
  ".markdown": "DOCUMENT",
  ".mdx": "DOCUMENT",
  ".txt": "DOCUMENT",
  ".doc": "DOCUMENT",
  ".docx": "DOCUMENT",
  ".rtf": "DOCUMENT",
  ".rst": "DOCUMENT",
  ".adoc": "DOCUMENT",
  ".asciidoc": "DOCUMENT",

  // PDF
  ".pdf": "PDF",

  // Images
  ".png": "IMAGE",
  ".jpg": "IMAGE",
  ".jpeg": "IMAGE",
  ".gif": "IMAGE",
  ".webp": "IMAGE",
  ".svg": "IMAGE",
  ".ico": "IMAGE",
  ".bmp": "IMAGE",
  ".tiff": "IMAGE",
  ".tif": "IMAGE",
  ".avif": "IMAGE",

  // Audio
  ".mp3": "AUDIO",
  ".wav": "AUDIO",
  ".ogg": "AUDIO",
  ".flac": "AUDIO",
  ".aac": "AUDIO",
  ".m4a": "AUDIO",
  ".wma": "AUDIO",
  ".opus": "AUDIO",

  // Video
  ".mp4": "VIDEO",
  ".webm": "VIDEO",
  ".mov": "VIDEO",
  ".avi": "VIDEO",
  ".mkv": "VIDEO",
  ".flv": "VIDEO",
  ".wmv": "VIDEO",

  // Archives
  ".zip": "ARCHIVE",
  ".tar": "ARCHIVE",
  ".gz": "ARCHIVE",
  ".rar": "ARCHIVE",
  ".7z": "ARCHIVE",
};

export function detectFileType(ext: string): FileType {
  return FILE_TYPE_MAP[ext.toLowerCase()] ?? "UNKNOWN";
}
