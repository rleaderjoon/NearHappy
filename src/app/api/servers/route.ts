export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { nanoid } from "nanoid";
import { discoverTools } from "@/lib/mcp-client";
import {
  insertServer,
  insertTools,
  getServerByUrl,
  getToolsByServerId,
  listServers,
} from "@/lib/db";

const RegisterSchema = z.object({
  url: z.string().url(),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const parsed = RegisterSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  const { url } = parsed.data;

  // Idempotent: return existing if already registered
  const existing = getServerByUrl(url);
  if (existing) {
    const tools = getToolsByServerId(existing.id);
    return NextResponse.json({ server: existing, tools });
  }

  let discovery;
  try {
    discovery = await discoverTools(url);
  } catch (e) {
    return NextResponse.json(
      { error: `Failed to connect to MCP server: ${(e as Error).message}` },
      { status: 502 }
    );
  }

  const serverId = nanoid();
  const now = Date.now();

  const server = {
    id: serverId,
    url,
    name: discovery.serverName,
    description: discovery.serverDescription ?? null,
    created_at: now,
  };

  insertServer(server);

  const tools = discovery.tools.map((t) => ({
    id: nanoid(),
    server_id: serverId,
    name: t.name,
    description: t.description ?? null,
    input_schema: JSON.stringify(t.inputSchema),
    created_at: now,
  }));

  insertTools(tools);

  return NextResponse.json({ server, tools });
}

export async function GET() {
  const servers = listServers();
  return NextResponse.json({ servers });
}
