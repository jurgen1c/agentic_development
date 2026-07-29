#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const packageJson = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
const tag = process.env.GITHUB_REF_NAME ?? process.argv[2];

if (!tag) throw new Error("A release tag is required.");
if (tag !== `v${packageJson.version}`) {
  throw new Error(`Release tag ${tag} does not match package version ${packageJson.version}.`);
}

for (const [name, range] of Object.entries(packageJson.dependencies ?? {})) {
  if (!/^\^\d+\.\d+\.\d+$/.test(range)) {
    throw new Error(`${name} must use a registry-safe caret semver range, found ${range}.`);
  }
}

console.log(`Verified release metadata for ${packageJson.name}@${packageJson.version}.`);
