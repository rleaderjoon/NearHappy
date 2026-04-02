import Database from "better-sqlite3";
import path from "path";
import type { Server, Tool, Module } from "@/types";

const DB_PATH = path.join(process.cwd(), "data", "nearhappy.db");

declare global {
  // eslint-disable-next-line no-var
  var __db: Database.Database | undefined;
}

export function getDb(): Database.Database {
  if (global.__db) return global.__db;

  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  db.exec(`
    CREATE TABLE IF NOT EXISTS servers (
      id          TEXT PRIMARY KEY,
      url         TEXT NOT NULL UNIQUE,
      name        TEXT NOT NULL,
      description TEXT,
      created_at  INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS tools (
      id           TEXT PRIMARY KEY,
      server_id    TEXT NOT NULL REFERENCES servers(id) ON DELETE CASCADE,
      name         TEXT NOT NULL,
      description  TEXT,
      input_schema TEXT NOT NULL,
      created_at   INTEGER NOT NULL,
      UNIQUE(server_id, name)
    );

    CREATE TABLE IF NOT EXISTS modules (
      id             TEXT PRIMARY KEY,
      tool_id        TEXT NOT NULL REFERENCES tools(id) ON DELETE CASCADE,
      component_code TEXT NOT NULL,
      claude_model   TEXT NOT NULL,
      prompt_version INTEGER NOT NULL DEFAULT 1,
      created_at     INTEGER NOT NULL,
      updated_at     INTEGER NOT NULL
    );

    CREATE UNIQUE INDEX IF NOT EXISTS modules_tool_id_unique ON modules(tool_id);
  `);

  global.__db = db;
  return db;
}

export const db = new Proxy({} as Database.Database, {
  get(_, prop) {
    return (getDb() as unknown as Record<string | symbol, unknown>)[prop];
  },
});

// --- Server helpers ---

export function insertServer(server: Server): void {
  const d = getDb();
  d.prepare(`
    INSERT OR IGNORE INTO servers (id, url, name, description, created_at)
    VALUES (@id, @url, @name, @description, @created_at)
  `).run(server);
}

export function getServerByUrl(url: string): Server | undefined {
  return getDb()
    .prepare("SELECT * FROM servers WHERE url = ?")
    .get(url) as Server | undefined;
}

export function getServerById(id: string): Server | undefined {
  return getDb()
    .prepare("SELECT * FROM servers WHERE id = ?")
    .get(id) as Server | undefined;
}

export function listServers(): Server[] {
  return getDb()
    .prepare("SELECT * FROM servers ORDER BY created_at DESC")
    .all() as Server[];
}

// --- Tool helpers ---

export function insertTools(tools: Tool[]): void {
  const d = getDb();
  const stmt = d.prepare(`
    INSERT OR IGNORE INTO tools (id, server_id, name, description, input_schema, created_at)
    VALUES (@id, @server_id, @name, @description, @input_schema, @created_at)
  `);
  const insertMany = d.transaction((rows: Tool[]) => {
    for (const row of rows) stmt.run(row);
  });
  insertMany(tools);
}

export function getToolsByServerId(serverId: string): Tool[] {
  return getDb()
    .prepare("SELECT * FROM tools WHERE server_id = ? ORDER BY name")
    .all(serverId) as Tool[];
}

export function getToolById(id: string): Tool | undefined {
  return getDb()
    .prepare("SELECT * FROM tools WHERE id = ?")
    .get(id) as Tool | undefined;
}

// --- Module helpers ---

export function getModuleByToolId(toolId: string): Module | undefined {
  return getDb()
    .prepare("SELECT * FROM modules WHERE tool_id = ?")
    .get(toolId) as Module | undefined;
}

export function upsertModule(mod: Module): void {
  getDb()
    .prepare(`
      INSERT INTO modules (id, tool_id, component_code, claude_model, prompt_version, created_at, updated_at)
      VALUES (@id, @tool_id, @component_code, @claude_model, @prompt_version, @created_at, @updated_at)
      ON CONFLICT(tool_id) DO UPDATE SET
        component_code = excluded.component_code,
        claude_model   = excluded.claude_model,
        prompt_version = excluded.prompt_version,
        updated_at     = excluded.updated_at
    `)
    .run(mod);
}
