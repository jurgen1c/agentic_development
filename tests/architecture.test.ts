import { describe, expect, test } from "bun:test";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(".");
const packageJson = JSON.parse(
  fs.readFileSync(path.join(root, "package.json"), "utf8")
) as {
  bin?: Record<string, string>;
  dependencies?: Record<string, string>;
  exports?: Record<string, unknown>;
  version: string;
};

describe("umbrella architecture", () => {
  test("depends on independently versioned public Memory and Flow packages", () => {
    expect(packageJson.version).toBe("0.1.0");
    expect(packageJson.bin).toBeUndefined();
    expect(packageJson.dependencies).toEqual({
      "@jurgen1c/agent-flow": "^0.1.0",
      "@jurgen1c/agent-memory-cli": "^0.3.0"
    });
    expect(Object.values(packageJson.dependencies ?? {}).every(
      (range) => /^\^\d+\.\d+\.\d+$/.test(range)
    )).toBe(true);
  });

  test("publishes the adapter only from the explicit integration subpath", () => {
    expect(Object.keys(packageJson.exports ?? {}).sort()).toEqual([
      ".",
      "./memory-flow-adapter"
    ]);

    const source = fs.readFileSync(
      path.join(root, "src/memory-flow-adapter.ts"),
      "utf8"
    );
    expect(source).toContain('from "@jurgen1c/agent-memory-cli"');
    expect(source).toContain('from "@jurgen1c/agent-flow"');
    expect(source).not.toContain("/src/");

    const lockfile = fs.readFileSync(path.join(root, "bun.lock"), "utf8");
    expect(lockfile).not.toMatch(/file:\/|workspace:|\/tmp\//i);
    expect(lockfile).toContain('"@jurgen1c/agent-flow@0.1.0"');
    expect(lockfile).toContain('"@jurgen1c/agent-memory-cli@0.3.0"');
  });
});
