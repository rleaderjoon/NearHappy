# NearHappy

MCP 서버 URL을 입력받아 툴 스키마를 읽고, LLM이 각 툴에 맞는 React UI 컴포넌트를 생성한다. 생성된 컴포넌트는 SQLite에 저장되어 재사용된다.

## Core Concept

기능(MCP server)과 UI를 분리한다. 개발자는 MCP 서버만 올리면 되고, 프론트는 이 허브가 자동 생성한다.

```
User inputs MCP URL
  → hub connects via MCP SDK, calls listTools()
  → for each tool: LLM generates React component from inputSchema
  → component saved to SQLite as "module"
  → react-live renders JSX string in browser
  → user submits form → POST /api/tools/invoke → hub calls MCP tool → result displayed
```

## Architecture

```
src/
├── app/
│   ├── page.tsx                      # Server component → renders HomeClient with listServers()
│   ├── server/[serverId]/page.tsx    # Server component → renders ToolCards
│   └── api/
│       ├── servers/route.ts          # POST: register URL (discoverTools → insert DB)
│       │                             # GET: list all servers
│       ├── servers/[serverId]/route.ts  # GET: server+tools  DELETE: remove server
│       ├── modules/route.ts          # GET: getOrCreate module (may call LLM)
│       │                             # POST: force regenerate  PATCH: save edited code
│       └── tools/invoke/route.ts     # POST: proxy tool call to MCP server
├── components/
│   ├── HomeClient.tsx                # "use client" — server list + URL input form
│   ├── ToolCard.tsx                  # "use client" — accordion, tab UI/Code, regen button
│   └── ModuleRenderer.tsx            # "use client" — react-live LiveProvider wrapper
└── lib/
    ├── db.ts                         # better-sqlite3 singleton (global.__db), all DB helpers
    ├── mcp-client.ts                 # discoverTools(), invokeTool() — StreamableHTTP → SSE fallback
    ├── claude.ts                     # generateToolComponent() — OpenAI chat completions
    └── module-generator.ts           # getOrCreateModule(), regenerateModule()
```

## Data Model

```sql
servers  (id, url, name, description, created_at)
tools    (id, server_id→servers, name, description, input_schema:JSON, created_at)
modules  (id, tool_id→tools UNIQUE, component_code:JSX_string, claude_model, prompt_version, created_at, updated_at)
```

`modules.tool_id` has UNIQUE index — one module per tool. Regeneration = upsert.

## Key Constraints

**react-live requires `noInline: true`** — generated components use hooks (useState, useEffect). Without noInline, hooks fail. The last line must be `render(<ToolUI />)`.

**No imports in generated code** — react-live sandbox only has what's in `scope`. Current scope: `{ React, useState, useEffect, fetch }`. Tailwind classes don't work (PostCSS build-time only). All styles must be inline.

**All API routes must declare `export const runtime = "nodejs"`** — better-sqlite3 and @modelcontextprotocol/sdk are Node-only. Edge runtime will fail silently.

**next.config.ts requires `serverExternalPackages`** — without it, Next.js tries to bundle better-sqlite3's native .node binary, which breaks.

**MCP transport fallback** — tries `StreamableHTTPClientTransport` first, falls back to `SSEClientTransport` at `{url}/sse`. Most new servers use StreamableHTTP.

**Zod v4** — `z.record()` requires two args: `z.record(z.string(), z.unknown())`. `.default()` behavior changed.

## LLM Prompt Contract

`src/lib/claude.ts` sends tool name + description + inputSchema to `gpt-4o-mini`. The prompt instructs the model to:
- name the component `ToolUI`
- end with `render(<ToolUI />)`
- POST to `/api/tools/invoke` with `{ serverId, toolName, args }`
- use inline styles only
- map JSON Schema types to appropriate HTML inputs

`PROMPT_VERSION` constant in `claude.ts` — bump this to invalidate cached modules when prompt changes.

## Environment

```
OPENAI_API_KEY=   # required for module generation
```

## Test MCP Server

`mcp-test-server.ts` runs on port 3001 with three tools: `add`, `count_characters`, `convert_currency`. Uses `StreamableHTTPServerTransport`. Register with `http://localhost:3001`.
