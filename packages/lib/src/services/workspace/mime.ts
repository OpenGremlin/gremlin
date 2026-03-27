const MIME_MAP: Record<string, string> = {
  // Images
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".bmp": "image/bmp",
  ".tiff": "image/tiff",
  ".tif": "image/tiff",
  ".avif": "image/avif",
  ".heic": "image/heic",
  ".heif": "image/heif",

  // Audio
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".ogg": "audio/ogg",
  ".flac": "audio/flac",
  ".aac": "audio/aac",
  ".m4a": "audio/mp4",
  ".wma": "audio/x-ms-wma",
  ".opus": "audio/opus",

  // Video
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mov": "video/quicktime",
  ".avi": "video/x-msvideo",
  ".mkv": "video/x-matroska",
  ".flv": "video/x-flv",
  ".wmv": "video/x-ms-wmv",

  // Documents
  ".md": "text/markdown",
  ".markdown": "text/markdown",
  ".txt": "text/plain",
  ".pdf": "application/pdf",
  ".doc": "application/msword",
  ".docx":
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".rtf": "application/rtf",
  ".csv": "text/csv",

  // Code / text
  ".html": "text/html",
  ".htm": "text/html",
  ".css": "text/css",
  ".js": "text/javascript",
  ".mjs": "text/javascript",
  ".cjs": "text/javascript",
  ".jsx": "text/javascript",
  ".ts": "text/typescript",
  ".tsx": "text/typescript",
  ".json": "application/json",
  ".jsonl": "application/json",
  ".xml": "application/xml",
  ".yaml": "text/yaml",
  ".yml": "text/yaml",
  ".toml": "text/plain",
  ".ini": "text/plain",
  ".env": "text/plain",
  ".sh": "text/x-shellscript",
  ".bash": "text/x-shellscript",
  ".zsh": "text/x-shellscript",
  ".fish": "text/x-shellscript",
  ".py": "text/x-python",
  ".rb": "text/x-ruby",
  ".java": "text/x-java-source",
  ".kt": "text/x-kotlin",
  ".go": "text/x-go",
  ".rs": "text/x-rust",
  ".c": "text/x-csrc",
  ".cpp": "text/x-c++src",
  ".h": "text/x-chdr",
  ".hpp": "text/x-c++hdr",
  ".cs": "text/x-csharp",
  ".swift": "text/x-swift",
  ".php": "text/x-php",
  ".r": "text/x-r",
  ".sql": "text/x-sql",
  ".graphql": "text/x-graphql",
  ".gql": "text/x-graphql",
  ".lua": "text/x-lua",
  ".pl": "text/x-perl",
  ".ex": "text/x-elixir",
  ".exs": "text/x-elixir",
  ".erl": "text/x-erlang",
  ".hs": "text/x-haskell",
  ".scala": "text/x-scala",
  ".clj": "text/x-clojure",
  ".dart": "text/x-dart",
  ".vue": "text/x-vue",
  ".svelte": "text/x-svelte",
  ".dockerfile": "text/x-dockerfile",
  ".tf": "text/x-terraform",
  ".proto": "text/x-protobuf",

  // Archives
  ".zip": "application/zip",
  ".tar": "application/x-tar",
  ".gz": "application/gzip",
  ".rar": "application/vnd.rar",
  ".7z": "application/x-7z-compressed",

  // Misc
  ".wasm": "application/wasm",
};

export function mimeByExtension(ext: string): string | null {
  return MIME_MAP[ext.toLowerCase()] ?? null;
}

export type RenderKind =
  | "image"
  | "document"
  | "code"
  | "audio"
  | "video"
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
]);

const DOCUMENT_EXTENSIONS = new Set([".md", ".markdown", ".txt"]);

export function detectRenderKind(mime: string | null, ext: string): RenderKind {
  const lower = ext.toLowerCase();

  if (DOCUMENT_EXTENSIONS.has(lower)) return "document";
  if (CODE_EXTENSIONS.has(lower)) return "code";

  if (mime) {
    if (mime.startsWith("image/")) return "image";
    if (mime.startsWith("audio/")) return "audio";
    if (mime.startsWith("video/")) return "video";
  }

  return "unknown";
}

const LANGUAGE_MAP: Record<string, string> = {
  ".js": "javascript",
  ".mjs": "javascript",
  ".cjs": "javascript",
  ".jsx": "jsx",
  ".ts": "typescript",
  ".tsx": "tsx",
  ".json": "json",
  ".jsonl": "json",
  ".xml": "xml",
  ".html": "html",
  ".htm": "html",
  ".css": "css",
  ".yaml": "yaml",
  ".yml": "yaml",
  ".toml": "toml",
  ".ini": "ini",
  ".env": "dotenv",
  ".sh": "bash",
  ".bash": "bash",
  ".zsh": "bash",
  ".fish": "fish",
  ".py": "python",
  ".rb": "ruby",
  ".java": "java",
  ".kt": "kotlin",
  ".go": "go",
  ".rs": "rust",
  ".c": "c",
  ".cpp": "cpp",
  ".h": "c",
  ".hpp": "cpp",
  ".cs": "csharp",
  ".swift": "swift",
  ".php": "php",
  ".r": "r",
  ".sql": "sql",
  ".graphql": "graphql",
  ".gql": "graphql",
  ".lua": "lua",
  ".pl": "perl",
  ".ex": "elixir",
  ".exs": "elixir",
  ".erl": "erlang",
  ".hs": "haskell",
  ".scala": "scala",
  ".clj": "clojure",
  ".dart": "dart",
  ".vue": "vue",
  ".svelte": "svelte",
  ".dockerfile": "dockerfile",
  ".tf": "hcl",
  ".proto": "protobuf",
  ".csv": "csv",
};

export function languageByExtension(ext: string): string {
  return LANGUAGE_MAP[ext.toLowerCase()] ?? "plaintext";
}
