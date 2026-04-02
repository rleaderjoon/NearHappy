"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Server } from "@/types";

interface HomeClientProps {
  initialServers: Server[];
}

export default function HomeClient({ initialServers }: HomeClientProps) {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState("");
  const [servers, setServers] = useState<Server[]>(initialServers);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;

    setStatus("loading");
    setError("");

    try {
      const res = await fetch("/api/servers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      router.push(`/server/${data.server.id}`);
    } catch (e) {
      setError((e as Error).message);
      setStatus("error");
    }
  }

  async function handleDelete(serverId: string) {
    setDeletingId(serverId);
    try {
      const res = await fetch(`/api/servers/${serverId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("삭제 실패");
      setServers((prev) => prev.filter((s) => s.id !== serverId));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <main style={{ maxWidth: 600, margin: "0 auto", padding: "48px 16px" }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 48 }}>
        <h1 style={{ fontSize: 32, fontWeight: 800, margin: 0, letterSpacing: -1 }}>
          NearHappy
        </h1>
        <p style={{ fontSize: 14, color: "#6b7280", marginTop: 8 }}>
          MCP 서버를 연결하면 AI가 UI를 자동으로 생성합니다
        </p>
      </div>

      {/* URL Input */}
      <form onSubmit={handleSubmit} style={{ marginBottom: 40 }}>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://your-mcp-server.com"
            required
            style={{
              flex: 1,
              padding: "10px 14px",
              border: "1px solid #d1d5db",
              borderRadius: 8,
              fontSize: 14,
              outline: "none",
              minWidth: 0,
            }}
          />
          <button
            type="submit"
            disabled={status === "loading"}
            style={{
              padding: "10px 20px",
              background: status === "loading" ? "#9ca3af" : "#111827",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              cursor: status === "loading" ? "not-allowed" : "pointer",
              whiteSpace: "nowrap",
            }}
          >
            {status === "loading" ? "연결 중..." : "연결"}
          </button>
        </div>

        {status === "error" && (
          <div
            style={{
              marginTop: 8,
              padding: "8px 12px",
              background: "#fef2f2",
              border: "1px solid #fecaca",
              borderRadius: 8,
              color: "#dc2626",
              fontSize: 13,
            }}
          >
            {error}
          </div>
        )}
      </form>

      {/* Server List */}
      {servers.length > 0 && (
        <div>
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
            등록된 서버 ({servers.length})
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {servers.map((server) => (
              <div
                key={server.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "12px 16px",
                  border: "1px solid #e5e7eb",
                  borderRadius: 10,
                  background: "#fff",
                  gap: 12,
                }}
              >
                {/* Server icon */}
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    background: "#f3f4f6",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 16,
                    flexShrink: 0,
                  }}
                >
                  {server.name.charAt(0).toUpperCase()}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>
                    {server.name}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "#9ca3af",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {server.url}
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                  <a
                    href={`/server/${server.id}`}
                    style={{
                      padding: "6px 12px",
                      background: "#111827",
                      color: "#fff",
                      borderRadius: 6,
                      fontSize: 13,
                      fontWeight: 500,
                      textDecoration: "none",
                    }}
                  >
                    열기
                  </a>
                  <button
                    onClick={() => handleDelete(server.id)}
                    disabled={deletingId === server.id}
                    style={{
                      padding: "6px 10px",
                      background: "none",
                      color: "#9ca3af",
                      border: "1px solid #e5e7eb",
                      borderRadius: 6,
                      fontSize: 13,
                      cursor: "pointer",
                    }}
                  >
                    {deletingId === server.id ? "..." : "삭제"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {servers.length === 0 && (
        <div
          style={{
            textAlign: "center",
            padding: "32px 0",
            color: "#9ca3af",
            fontSize: 14,
          }}
        >
          아직 연결된 서버가 없습니다
        </div>
      )}
    </main>
  );
}
