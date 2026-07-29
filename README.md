# Agentic Development

`@jurgen1c/agentic-development` is the deliberately thin integration package
for the standalone Agent Memory and Agent Flow products.

```sh
npm install @jurgen1c/agentic-development
```

The package has no CLI and owns no runtime state. Install and use the product
packages directly:

- `@jurgen1c/agent-memory-cli` owns repository Memory and `agent-memory`.
- `@jurgen1c/agent-flow` owns workflow execution and `agent-flow`.
- `@jurgen1c/agent-core` supplies their shared implementation primitives.

## Package metadata

```ts
import { agenticDevelopmentPackages } from "@jurgen1c/agentic-development";

console.log(agenticDevelopmentPackages.memory);
console.log(agenticDevelopmentPackages.flow);
```

## Memory–Flow adapter

The explicit adapter captures an Agent Memory context snapshot as an Agent Flow
artifact. Neither product imports the other.

```ts
import { openAgentFlowRunState } from "@jurgen1c/agent-flow";
import {
  createMemoryContextAdapter
} from "@jurgen1c/agentic-development/memory-flow-adapter";

const runState = await openAgentFlowRunState();
const adapter = createMemoryContextAdapter({ runState });

await adapter.captureContext({
  runId: "run-123",
  boundary: { kind: "run_start" },
  request: { task: "Review the authentication change" }
});
```

The consuming repository must already have compiled Agent Memory and a matching
Agent Flow run. The adapter writes only through Flow's public artifact API.

## Architecture

Dependency direction is one-way:

```text
agentic-development --> agent-memory
                      \-> agent-flow --> agent-core
                          agent-memory --> agent-core
```

The umbrella contains integration code only. Memory and Flow can be installed,
tested, versioned, and released independently.

See [docs/releasing.md](docs/releasing.md) for the release gate.
