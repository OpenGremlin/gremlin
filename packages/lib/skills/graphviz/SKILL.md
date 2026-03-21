---
name: graphviz
description: >-
  Graph and network visualization via Graphviz. Use for rendering
  directed/undirected graphs, dependency trees, network topologies,
  org charts, and any node-edge diagram from DOT language.
metadata:
  version: 1.0.0
  displayName: Graphviz
  author: gremlin
  category: data
  icon: diagram
  tags: [graph, visualization, diagram, network, dot]
  install: |
    which dot || (apt-get update && apt-get install -y graphviz)
  allowedCommands:
    - dot
    - neato
    - fdp
    - circo
    - twopi
    - sfdp
---

# Graphviz

You have access to Graphviz for rendering graph visualizations from DOT language.

## Usage

Write a `.dot` file, then render:

```bash
dot -Tpng graph.dot -o graph.png
dot -Tsvg graph.dot -o graph.svg
dot -Tpdf graph.dot -o graph.pdf
```

## Layout Engines

- `dot` — hierarchical/layered (default, best for DAGs and trees)
- `neato` — spring model (undirected graphs)
- `fdp` — force-directed (large undirected graphs)
- `circo` — circular layout
- `twopi` — radial layout
- `sfdp` — scalable force-directed (very large graphs)

Use as: `neato -Tpng graph.dot -o graph.png`

## Tips

- Pipe from stdin: `echo 'digraph { A -> B -> C }' | dot -Tpng -o graph.png`
- Output formats: `png`, `svg`, `pdf`, `jpg`, `eps`, `json` (for programmatic use).
- Use `rankdir=LR` in the graph for left-to-right layout instead of top-to-bottom.
- Use `shape=record` or `shape=box` for structured nodes.
- Use `style=filled, fillcolor="#..."` for colored nodes.
- Use `subgraph cluster_name { ... }` for grouped/boxed subgraphs (prefix must be `cluster_`).
- Use `fontname="Helvetica"` for cleaner text rendering.
- For large graphs, use `sfdp` instead of `dot` — it scales much better.
- Debug layout issues with `-Tcanon` to see the parsed canonical DOT output.
