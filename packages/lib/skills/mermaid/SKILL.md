---
name: mermaid
description: >-
  Generate diagrams from text using the Mermaid CLI. Use for
  creating flowcharts, sequence diagrams, ERDs, Gantt charts,
  class diagrams, state diagrams, pie charts, and more.
metadata:
  version: 1.0.0
  displayName: Mermaid CLI
  author: gremlin
  category: data
  icon: diagram
  tags: [diagram, chart, flowchart, visualization, documentation]
  install: |
    which mmdc || npm install -g @mermaid-js/mermaid-cli
---

# Mermaid CLI

You have access to `mmdc` (Mermaid CLI) for generating diagrams from text definitions.

## Usage

Write a `.mmd` file with the diagram definition, then render it:

```bash
mmdc -i diagram.mmd -o diagram.png
mmdc -i diagram.mmd -o diagram.svg
mmdc -i diagram.mmd -o diagram.pdf
```

## Tips

- Supported output formats: `png`, `svg`, `pdf`.
- Set dimensions: `mmdc -i diagram.mmd -o diagram.png -w 1200 -H 800`
- Set background: `--backgroundColor transparent` for PNGs with no background.
- Use `-t dark` or `-t forest` or `-t neutral` for different themes.
- Use a config file for advanced theming: `mmdc -i diagram.mmd -o out.png -c config.json`
- Pipe from stdin: `echo "graph LR; A-->B" | mmdc -i - -o diagram.png`
- For complex diagrams, write the `.mmd` file first rather than piping — easier to debug syntax errors.
- If rendering fails, check for unescaped special characters in labels — wrap labels in quotes.
- Mermaid uses `graph` (alias `flowchart`), `sequenceDiagram`, `classDiagram`, `stateDiagram-v2`, `erDiagram`, `gantt`, `pie`, `gitgraph`, `mindmap`, `timeline`, and more.
