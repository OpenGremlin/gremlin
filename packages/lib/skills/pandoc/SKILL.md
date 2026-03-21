---
name: pandoc
description: >-
  Universal document converter via the Pandoc CLI. Use for
  converting between Markdown, HTML, DOCX, PDF, EPUB, LaTeX,
  reStructuredText, and dozens of other document formats.
metadata:
  version: 1.0.0
  displayName: Pandoc
  author: gremlin
  category: data
  icon: file-text
  tags: [document, conversion, markdown, pdf, docx]
  install: |
    which pandoc || (apt-get update && apt-get install -y pandoc)
  allowedCommands:
    - pandoc
---

# Pandoc

You have access to `pandoc` for document format conversion.

## Safety

- Always confirm before overwriting existing output files.
- PDF output requires a LaTeX engine (`pdflatex`, `xelatex`, or `tectonic`). If unavailable, convert to HTML first or use `--pdf-engine=wkhtmltopdf` as an alternative.

## Tips

- Basic conversion: `pandoc input.md -o output.docx` — format is inferred from extension.
- Explicit formats: `pandoc -f markdown -t html input.md -o output.html`
- List supported formats: `pandoc --list-input-formats` / `pandoc --list-output-formats`
- Standalone HTML (with `<head>`): `pandoc -s input.md -o output.html`
- Apply CSS to HTML output: `pandoc -s --css=style.css input.md -o output.html`
- PDF with custom margins: `pandoc input.md -o output.pdf -V geometry:margin=1in`
- Table of contents: `pandoc --toc input.md -o output.pdf`
- Use `--extract-media=./media` when converting from DOCX to extract embedded images.
- Merge multiple files: `pandoc ch1.md ch2.md ch3.md -o book.pdf`
- Use `--reference-doc=template.docx` to apply DOCX styling from a template.
- Use `--metadata title="My Doc"` to set document metadata.
- Pipe from stdin: `echo "# Hello" | pandoc -f markdown -t html`
