import { describe, expect, test } from "bun:test";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { readCompileMetadata } from "../src/memory-flow-adapter";
import { openSqliteDatabase } from "@jurgen1c/agent-memory-cli";

describe("Memory–Flow adapter", () => {
  test("reads deterministic compile metadata through Memory's public SQLite API", async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "agentic-development-"));
    const databasePath = path.join(root, "memory.sqlite");
    const database = await openSqliteDatabase(databasePath);
    database.exec("CREATE TABLE compile_metadata (key TEXT PRIMARY KEY, value TEXT NOT NULL)");
    database.run("INSERT INTO compile_metadata (key, value) VALUES (?, ?)", ["zeta", "last"]);
    database.run("INSERT INTO compile_metadata (key, value) VALUES (?, ?)", ["alpha", "first"]);
    database.close();

    expect(await readCompileMetadata(databasePath)).toEqual({
      alpha: "first",
      zeta: "last"
    });
  });
});
