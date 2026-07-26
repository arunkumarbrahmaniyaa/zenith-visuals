# @zenith-visuals/ai

AI agent graph and prompt-flow visualizations for Zenith Visuals.

Part of [**Zenith Visuals**](https://github.com/zenith-visuals/zenith-visuals) — the ultimate React visualization SDK. TypeScript-first, tree-shakeable, SSR-safe and accessible.

## Install

```bash
npm install @zenith-visuals/ai
```

> Requires `react` (>=18) as a peer dependency where applicable.

## Usage

```tsx
import { AgentGraph } from "@zenith-visuals/ai";

<AgentGraph
  data={{
    nodes: [
      { id: "planner", label: "Planner", type: "planner", status: "success" },
      { id: "search", label: "Web Search", type: "tool", status: "success", latencyMs: 320 },
      { id: "llm", label: "GPT-4o", type: "llm", status: "streaming", tokens: 1284 },
      { id: "out", label: "Response", type: "response", status: "running" },
    ],
    edges: [
      { source: "planner", target: "search" },
      { source: "search", target: "llm" },
      { source: "llm", target: "out", streaming: true },
    ],
  }}
  onNodeClick={(node) => console.log(node.id)}
/>;
```

Node `status` (`idle`/`running`/`success`/`error`/`streaming`) drives accent
colors; `tokens`/`latencyMs` render as badges; `streaming` edges animate. The
layered-DAG layout `computeAgentLayout` is exported for headless use.

> Wrap component trees in `<ThemeProvider>` from `@zenith-visuals/core` to enable
> theming and dark mode.

## Documentation

See the [main README](https://github.com/zenith-visuals/zenith-visuals#readme) for the full API, theming and more examples.

## License

MIT
