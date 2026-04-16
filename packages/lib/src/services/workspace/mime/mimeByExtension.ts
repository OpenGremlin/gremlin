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
  ".tfvars": "text/x-terraform",
  ".proto": "text/x-protobuf",
  ".mmd": "text/vnd.mermaid",
  ".mermaid": "text/vnd.mermaid",

  // CSS preprocessors
  ".scss": "text/x-scss",
  ".sass": "text/x-sass",
  ".less": "text/x-less",
  ".styl": "text/x-stylus",

  // Templates
  ".hbs": "text/x-handlebars-template",
  ".handlebars": "text/x-handlebars-template",
  ".ejs": "text/x-ejs",
  ".pug": "text/x-pug",
  ".liquid": "text/x-liquid",
  ".twig": "text/x-twig",

  // JSON variants / tabular
  ".jsonc": "application/json",
  ".json5": "application/json",
  ".ndjson": "application/x-ndjson",
  ".tsv": "text/tab-separated-values",

  // Documentation
  ".mdx": "text/mdx",
  ".rst": "text/x-rst",
  ".adoc": "text/x-asciidoc",
  ".asciidoc": "text/x-asciidoc",

  // Patches
  ".diff": "text/x-diff",
  ".patch": "text/x-diff",

  // Other languages
  ".nix": "text/x-nix",
  ".zig": "text/x-zig",
  ".jl": "text/x-julia",
  ".ml": "text/x-ocaml",
  ".mli": "text/x-ocaml",
  ".groovy": "text/x-groovy",
  ".gradle": "text/x-groovy",
  ".astro": "text/x-astro",
  ".rkt": "text/x-racket",
  ".lisp": "text/x-lisp",
  ".scm": "text/x-scheme",
  ".fs": "text/x-fsharp",
  ".fsx": "text/x-fsharp",
  ".v": "text/x-verilog",
  ".sv": "text/x-verilog",
  ".nim": "text/x-nim",
  ".cr": "text/x-crystal",
  ".d": "text/x-d",

  // Build tooling
  ".cmake": "text/x-cmake",
  ".mk": "text/x-makefile",
  ".makefile": "text/x-makefile",

  // Misc plaintext-ish
  ".log": "text/plain",
  ".procfile": "text/plain",
  ".gitignore": "text/plain",
  ".gitattributes": "text/plain",
  ".dockerignore": "text/plain",
  ".editorconfig": "text/plain",

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
