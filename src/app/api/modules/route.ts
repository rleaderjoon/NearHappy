export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getOrCreateModule, regenerateModule } from "@/lib/module-generator";
import { getModuleByToolId, getDb } from "@/lib/db";

const QuerySchema = z.object({
  toolId: z.string(),
  serverId: z.string(),
});

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const parsed = QuerySchema.safeParse({
    toolId: searchParams.get("toolId"),
    serverId: searchParams.get("serverId"),
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: "toolId and serverId are required" },
      { status: 400 }
    );
  }

  try {
    const mod = await getOrCreateModule(
      parsed.data.toolId,
      parsed.data.serverId
    );
    return NextResponse.json({ module: mod });
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message },
      { status: 500 }
    );
  }
}

// 재생성
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const parsed = QuerySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "toolId and serverId are required" },
      { status: 400 }
    );
  }

  try {
    const mod = await regenerateModule(
      parsed.data.toolId,
      parsed.data.serverId
    );
    return NextResponse.json({ module: mod });
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message },
      { status: 500 }
    );
  }
}

// 코드 직접 저장 (수동 편집)
export async function PATCH(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const parsed = z
    .object({ toolId: z.string(), componentCode: z.string() })
    .safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const existing = getModuleByToolId(parsed.data.toolId);
  if (!existing) {
    return NextResponse.json({ error: "Module not found" }, { status: 404 });
  }

  getDb()
    .prepare(
      "UPDATE modules SET component_code = ?, updated_at = ? WHERE tool_id = ?"
    )
    .run(parsed.data.componentCode, Date.now(), parsed.data.toolId);

  return NextResponse.json({ ok: true });
}
