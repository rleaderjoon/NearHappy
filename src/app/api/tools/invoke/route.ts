export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerById } from "@/lib/db";
import { invokeTool } from "@/lib/mcp-client";

const InvokeSchema = z.object({
  serverId: z.string(),
  toolName: z.string(),
  args: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const parsed = InvokeSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { serverId, toolName, args = {} } = parsed.data;

  const server = getServerById(serverId);
  if (!server) {
    return NextResponse.json({ error: "Server not found" }, { status: 404 });
  }

  try {
    const result = await invokeTool(server.url, toolName, args);
    return NextResponse.json({ result });
  } catch (e) {
    return NextResponse.json(
      { error: `Tool invocation failed: ${(e as Error).message}` },
      { status: 502 }
    );
  }
}
