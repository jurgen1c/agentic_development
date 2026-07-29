#!/usr/bin/env node
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const repositoryRoot = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), "agentic-development-package-"));
const localTarballs = parseLocalTarballs(process.argv.slice(2));

try {
  run("bun", ["run", "build"]);
  const manifest = pack(true);
  const files = manifest.files.map((entry) => entry.path);

  for (const required of [
    "package.json",
    "README.md",
    "LICENSE",
    "dist/index.js",
    "dist/index.d.ts",
    "dist/memory-flow-adapter.js",
    "dist/memory-flow-adapter.d.ts"
  ]) {
    if (!files.includes(required)) {
      throw new Error(`Packed artifact is missing ${required}.`);
    }
  }

  const forbidden = files.filter((file) =>
    /(^|\/)(?:src|tests?|fixtures?|examples?|coverage|node_modules|\.git)(?:\/|$)/i.test(file)
    || /(^|\/)\.env(?:\.|$)/i.test(file)
    || /\.(?:sqlite|db|pem|key|log)$/i.test(file)
  );
  if (forbidden.length > 0) {
    throw new Error(`Packed artifact contains forbidden files:\n${forbidden.join("\n")}`);
  }

  const packageJson = JSON.parse(
    fs.readFileSync(path.join(repositoryRoot, "package.json"), "utf8")
  );
  if (
    Object.values(packageJson.dependencies ?? {}).some(
      (range) => typeof range === "string" && !/^\^\d+\.\d+\.\d+$/.test(range)
    )
  ) {
    throw new Error("Published dependencies must use registry caret semver ranges.");
  }

  const packed = pack(false);
  const tarballPath = path.join(temporaryRoot, packed.filename);
  const consumerRoot = path.join(temporaryRoot, "consumer");
  fs.mkdirSync(consumerRoot);
  fs.writeFileSync(
    path.join(consumerRoot, "package.json"),
    `${JSON.stringify({ private: true, type: "module" }, null, 2)}\n`
  );
  fs.writeFileSync(
    path.join(consumerRoot, "smoke.mjs"),
    `import {
  agenticDevelopmentPackageBoundary,
  agenticDevelopmentPackages
} from "@jurgen1c/agentic-development";
import {
  createMemoryContextAdapter,
  readCompileMetadata
} from "@jurgen1c/agentic-development/memory-flow-adapter";

if (
  agenticDevelopmentPackageBoundary.packageName !== "@jurgen1c/agentic-development"
  || agenticDevelopmentPackages.memory !== "@jurgen1c/agent-memory-cli"
  || typeof createMemoryContextAdapter !== "function"
  || typeof readCompileMetadata !== "function"
) {
  throw new Error("Agentic Development public API smoke test failed.");
}
console.log("Agentic Development tarball smoke test passed.");
`
  );

  run("npm", [
    "install",
    "--no-audit",
    "--no-fund",
    "--ignore-scripts",
    ...localTarballs.map((entry) => path.resolve(entry)),
    tarballPath
  ], consumerRoot);
  run("npm", ["audit", "--audit-level", "moderate"], consumerRoot);
  run(process.execPath, ["smoke.mjs"], consumerRoot);

  console.log(
    `Verified ${manifest.name}@${manifest.version}: ${files.length} packed files and a clean consumer install.`
  );
} finally {
  fs.rmSync(temporaryRoot, { recursive: true, force: true });
}

function pack(dryRun) {
  const args = [
    "pack",
    ...(dryRun ? ["--dry-run"] : []),
    "--json",
    "--ignore-scripts",
    "--pack-destination",
    temporaryRoot
  ];
  const entries = JSON.parse(run("npm", args));
  if (!Array.isArray(entries) || entries.length !== 1) {
    throw new Error("npm pack did not return exactly one artifact.");
  }
  return entries[0];
}

function parseLocalTarballs(args) {
  if (args.length === 0) return [];
  const allowed = new Set(["--core-tarball", "--memory-tarball", "--flow-tarball"]);
  const values = [];

  for (let index = 0; index < args.length; index += 2) {
    if (!allowed.has(args[index]) || args[index + 1] === undefined) {
      throw new Error(
        "Usage: verify-package.mjs [--core-tarball path] [--memory-tarball path] [--flow-tarball path]"
      );
    }
    values.push(args[index + 1]);
  }

  return values;
}

function run(command, args, cwd = repositoryRoot) {
  const result = spawnSync(command, args, {
    cwd,
    encoding: "utf8",
    env: {
      ...process.env,
      npm_config_cache: path.join(temporaryRoot, "npm-cache")
    }
  });

  if (result.error || result.status !== 0) {
    throw new Error([
      `${command} ${args.join(" ")} failed.`,
      result.error?.message ?? "",
      result.stdout ?? "",
      result.stderr ?? ""
    ].filter(Boolean).join("\n"));
  }

  return result.stdout.length > 0 ? result.stdout : result.stderr;
}
