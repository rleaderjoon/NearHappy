import { getServerById, getToolsByServerId } from "@/lib/db";
import ToolCard from "@/components/ToolCard";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function ServerPage({
  params,
}: {
  params: Promise<{ serverId: string }>;
}) {
  const { serverId } = await params;
  const server = getServerById(serverId);

  if (!server) notFound();

  const tools = getToolsByServerId(serverId);

  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "32px 16px" }}>
      {/* Breadcrumb */}
      <Link
        href="/"
        style={{ fontSize: 13, color: "#6b7280", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4 }}
      >
        ← NearHappy
      </Link>

      {/* Server header */}
      <div
        style={{
          marginTop: 20,
          marginBottom: 32,
          display: "flex",
          alignItems: "center",
          gap: 16,
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            background: "#f3f4f6",
            border: "1px solid #e5e7eb",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 22,
            fontWeight: 700,
            flexShrink: 0,
          }}
        >
          {server.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>{server.name}</h1>
          <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>{server.url}</div>
        </div>
      </div>

      {/* Tool count */}
      <div
        style={{
          fontSize: 12,
          fontWeight: 600,
          color: "#9ca3af",
          letterSpacing: 1,
          textTransform: "uppercase",
          marginBottom: 12,
        }}
      >
        툴 ({tools.length})
      </div>

      {tools.length === 0 ? (
        <div style={{ color: "#9ca3af", fontSize: 14, padding: "24px 0" }}>
          이 서버에 툴이 없습니다.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {tools.map((tool) => (
            <ToolCard key={tool.id} tool={tool} serverId={serverId} />
          ))}
        </div>
      )}
    </main>
  );
}
