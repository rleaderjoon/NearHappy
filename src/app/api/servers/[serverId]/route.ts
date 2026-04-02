export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { getServerById, getToolsByServerId } from "@/lib/db";
import { getDb } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ serverId: string }> }
) {
  const { serverId } = await params;
  const server = getServerById(serverId);

  if (!server) {
    return NextResponse.json({ error: "Server not found" }, { status: 404 });
  }

  const tools = getToolsByServerId(serverId);
  return NextResponse.json({ server, tools });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ serverId: string }> }
) {
  const { serverId } = await params;
  const server = getServerById(serverId);

  if (!server) {
    return NextResponse.json({ error: "Server not found" }, { status: 404 });
  }

  getDb().prepare("DELETE FROM servers WHERE id = ?").run(serverId);
  return NextResponse.json({ ok: true });
}
