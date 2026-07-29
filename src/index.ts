export const agenticDevelopmentPackages = Object.freeze({
  memory: "@jurgen1c/agent-memory-cli",
  flow: "@jurgen1c/agent-flow",
  adapter: "@jurgen1c/agentic-development/memory-flow-adapter"
} as const);

export const agenticDevelopmentPackageBoundary = Object.freeze({
  packageName: "@jurgen1c/agentic-development",
  role: "memory-flow-integration",
  runtimeOwnership: "none",
  packages: agenticDevelopmentPackages
} as const);
