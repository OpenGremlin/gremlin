// Common extensionless files (and dot-prefixed basenames, which look
// extensionless to `path.extname`). Keys are lowercased basenames; values
// are the synthetic extension to use downstream so the same map lookups
// work for both cases.
const BASENAME_EXTENSION_ALIASES: Record<string, string> = {
  dockerfile: ".dockerfile",
  makefile: ".makefile",
  gnumakefile: ".makefile",
  rakefile: ".rb",
  gemfile: ".rb",
  podfile: ".rb",
  brewfile: ".rb",
  vagrantfile: ".rb",
  jenkinsfile: ".groovy",
  procfile: ".procfile",
  ".gitignore": ".gitignore",
  ".gitattributes": ".gitattributes",
  ".dockerignore": ".dockerignore",
  // Sibling ignore files share the gitignore grammar.
  ".npmignore": ".gitignore",
  ".eslintignore": ".gitignore",
  ".prettierignore": ".gitignore",
  ".editorconfig": ".editorconfig",
};

/**
 * Returns the extension to use for lookups in MIME / language / render
 * maps. For files with an extension this behaves like `path.extname`; for
 * extensionless files with a well-known basename (Dockerfile, Makefile,
 * .gitignore, …) it returns a synthetic alias extension so a single lookup
 * covers both cases.
 *
 * Accepts either a basename or a full path.
 */
export function effectiveExtension(filename: string): string {
  const slash = Math.max(filename.lastIndexOf("/"), filename.lastIndexOf("\\"));
  const base = slash >= 0 ? filename.slice(slash + 1) : filename;
  const dot = base.lastIndexOf(".");
  // Match `path.extname` semantics: only dots past index 0 count as an
  // extension separator (so ".gitignore" is treated as extensionless).
  if (dot > 0) return base.slice(dot).toLowerCase();
  return BASENAME_EXTENSION_ALIASES[base.toLowerCase()] ?? "";
}
