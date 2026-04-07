import { marked } from "marked";

/**
 * Wrap inner HTML in a minimal page that prints well via expo-print.
 * Uses system fonts and conservative margins so it looks reasonable on
 * both Letter and A4 paper without page-specific tweaking.
 */
function wrapPage(title: string, body: string): string {
  const safeTitle = escapeHtml(title);
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>${safeTitle}</title>
<style>
  @page { margin: 0.75in; }
  html, body {
    font-family: -apple-system, BlinkMacSystemFont, "Helvetica Neue", Helvetica, Arial, sans-serif;
    font-size: 12pt;
    line-height: 1.5;
    color: #111;
  }
  h1, h2, h3, h4, h5, h6 { color: #000; line-height: 1.25; }
  h1 { font-size: 22pt; margin: 0 0 12pt; }
  h2 { font-size: 18pt; margin: 18pt 0 8pt; }
  h3 { font-size: 14pt; margin: 14pt 0 6pt; }
  p { margin: 0 0 8pt; }
  a { color: #1a4fb5; text-decoration: none; }
  blockquote {
    border-left: 3pt solid #ccc;
    margin: 8pt 0;
    padding: 0 12pt;
    color: #444;
  }
  code {
    font-family: "SF Mono", Menlo, Consolas, monospace;
    font-size: 10.5pt;
    background: #f3f3f3;
    padding: 1pt 4pt;
    border-radius: 3pt;
  }
  pre {
    font-family: "SF Mono", Menlo, Consolas, monospace;
    font-size: 9.5pt;
    line-height: 1.35;
    background: #f6f6f6;
    border: 1pt solid #e2e2e2;
    border-radius: 4pt;
    padding: 10pt;
    white-space: pre-wrap;
    word-wrap: break-word;
    page-break-inside: auto;
  }
  pre code { background: transparent; padding: 0; font-size: inherit; }
  img { max-width: 100%; height: auto; }
  table { border-collapse: collapse; width: 100%; margin: 8pt 0; }
  th, td { border: 1pt solid #ddd; padding: 4pt 6pt; text-align: left; }
  hr { border: none; border-top: 1pt solid #ddd; margin: 12pt 0; }
</style>
</head>
<body>${body}</body>
</html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function markdownPrintHtml(title: string, markdown: string): string {
  // marked.parse is sync when called without async option.
  const body = marked.parse(markdown, { async: false }) as string;
  return wrapPage(title, body);
}

export function codePrintHtml(
  title: string,
  language: string,
  content: string,
): string {
  const safeLang = escapeHtml(language || "text");
  const body = `<h1>${escapeHtml(title)}</h1>
<p style="color:#666;font-family:'SF Mono',Menlo,Consolas,monospace;font-size:10pt;margin-bottom:8pt;">${safeLang}</p>
<pre><code>${escapeHtml(content)}</code></pre>`;
  return wrapPage(title, body);
}

export function imagePrintHtml(title: string, dataUri: string): string {
  const body = `<div style="text-align:center;">
  <img src="${dataUri}" alt="${escapeHtml(title)}" />
</div>`;
  return wrapPage(title, body);
}
