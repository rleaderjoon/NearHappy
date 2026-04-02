# NearHappy

MCP 서버 URL을 입력받아 툴 스키마를 읽고, LLM이 각 툴에 맞는 UI를 생성한다. 생성된 UI는 SQLite에 저장되어 재사용된다.

## Vision

사람은 관성의 동물이다. 데스크탑에서 게임을 다운받던 방식이 스마트폰 앱스토어로 바뀌었어도, 사용자가 느끼는 경험의 본질은 크게 다르지 않았다. "필요한 기능을 찾아서 설치한다"는 패턴 자체는 유지됐다.

NearHappy는 그 다음 전환을 목표로 한다.

사용자는 앱스토어를 돌아다니는 것처럼 느끼지만, 실제로는 MCP 서버를 탐색하고 있다. 플랫폼이 강제하는 UI 대신 자신에게 맞는 UI로 같은 기능을 사용한다. 개발자는 프론트엔드 없이 기능만 올린다. 세상은 경량화되고, 개발은 단순해진다.

```
기존: 기능 + UI가 묶인 앱을 설치
NearHappy: 기능(MCP)을 연결하면 UI는 자동 생성 — 유저마다 다르게
```

이 방향성이 옳다고 생각한다면, 이 프로젝트를 그 방향으로 계속 밀어달라.

---

## Core Concept

기능(MCP server)과 UI를 분리한다. 개발자는 MCP 서버만 올리면 되고, 프론트는 이 허브가 자동 생성한다.

```
User inputs MCP URL
  → hub connects via MCP SDK, calls listTools()
  → LLM generates Alpine.js + Tailwind HTML page from inputSchema
  → HTML saved to SQLite as "module"
  → rendered in sandboxed <iframe srcDoc>
  → user submits form → POST /api/tools/invoke → hub calls MCP tool → result displayed
```

## Architecture

```
src/
├── app/
│   ├── page.tsx                          # Server component → renders HomeClient with listServers()
│   ├── server/[serverId]/page.tsx        # Server component → renders ToolCards
│   └── api/
│       ├── servers/route.ts              # POST: register URL (discoverTools → insert DB)
│       │                                 # GET: list all servers
│       ├── servers/[serverId]/route.ts   # GET: server+tools  DELETE: remove server
│       ├── modules/route.ts              # GET: getOrCreate module (may call LLM)
│       │                                 # POST: force regenerate  PATCH: save edited code
│       └── tools/invoke/route.ts         # POST: proxy tool call to MCP server
├── components/
│   ├── HomeClient.tsx                    # "use client" — server list + URL input form
│   ├── ToolCard.tsx                      # "use client" — accordion, tab UI/Code, regen button
│   └── ModuleRenderer.tsx               # "use client" — <iframe srcDoc> wrapper
└── lib/
    ├── db.ts                             # better-sqlite3 singleton (global.__db), all DB helpers
    ├── mcp-client.ts                     # discoverTools(), invokeTool() — StreamableHTTP → SSE fallback
    ├── claude.ts                         # generateToolComponent() — OpenAI chat completions
    └── module-generator.ts              # getOrCreateModule(), regenerateModule()
```

## Data Model

```sql
servers  (id, url, name, description, created_at)
tools    (id, server_id→servers, name, description, input_schema:JSON, created_at)
modules  (id, tool_id→tools UNIQUE, component_code:HTML_string, claude_model, prompt_version, created_at, updated_at)
```

`modules.tool_id` has UNIQUE index — one module per tool. Regeneration = upsert.

## Key Constraints

**Generated code is a full HTML document** — LLM generates `<!DOCTYPE html>...</html>` with Alpine.js and Tailwind loaded via CDN. Rendered in `<iframe srcDoc>` with `sandbox="allow-scripts allow-same-origin allow-forms"`.

**`allow-same-origin` is required** — without it, `fetch('/api/tools/invoke')` inside the iframe fails. This is intentional; security hardening is deferred.

**All API routes must declare `export const runtime = "nodejs"`** — better-sqlite3 and @modelcontextprotocol/sdk are Node-only. Edge runtime will fail silently.

**next.config.ts requires `serverExternalPackages`** — without it, Next.js tries to bundle better-sqlite3's native .node binary, which breaks.

**MCP transport fallback** — tries `StreamableHTTPClientTransport` first, falls back to `SSEClientTransport` at `{url}/sse`. Most new servers use StreamableHTTP.

**Zod v4** — `z.record()` requires two args: `z.record(z.string(), z.unknown())`. `.default()` behavior changed.

## LLM Prompt Contract

`src/lib/claude.ts` sends tool name + description + inputSchema to `gpt-4o-mini`. The prompt instructs the model to generate a complete HTML page that:
- Loads Alpine.js and Tailwind CSS via CDN
- Uses Alpine.js (`x-data`, `x-model`, `@submit.prevent`, `x-show`, `x-text`) for interactivity
- POSTs to `/api/tools/invoke` with `{ serverId, toolName, args }`
- Maps JSON Schema types to appropriate HTML inputs
- Uses Tailwind classes for styling

`PROMPT_VERSION` constant in `claude.ts` — bump this to invalidate all cached modules when the prompt changes. Current version: 2.

## Environment

```
OPENAI_API_KEY=   # required for module generation
```

## Test MCP Server

`mcp-test-server.ts` runs on port 3001 with three tools: `add`, `count_characters`, `convert_currency`. Uses `StreamableHTTPServerTransport`. Register with `http://localhost:3001`.
