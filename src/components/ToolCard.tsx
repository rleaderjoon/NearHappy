"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import type { Tool } from "@/types";

const ModuleRenderer = dynamic(() => import("./ModuleRenderer"), { ssr: false });

interface ToolCardProps {
  tool: Tool;
  serverId: string;
}

type UIState = "idle" | "loading" | "ready" | "error";
type Tab = "ui" | "code";

export default function ToolCard({ tool, serverId }: ToolCardProps) {
  const [uiState, setUiState] = useState<UIState>("idle");
  const [componentCode, setComponentCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("ui");
  const [editedCode, setEditedCode] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function loadModule() {
    setUiState("loading");
    setError(null);
    try {
      const res = await fetch(
        `/api/modules?toolId=${tool.id}&serverId=${serverId}`
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setComponentCode(data.module.component_code);
      setEditedCode(data.module.component_code);
      setUiState("ready");
    } catch (e) {
      setError((e as Error).message);
      setUiState("error");
    }
  }

  async function handleOpen() {
    const next = !open;
    setOpen(next);
    if (next && !componentCode) {
      await loadModule();
    }
  }

  async function handleRegenerate() {
    setUiState("loading");
    setError(null);
    try {
      const res = await fetch("/api/modules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toolId: tool.id, serverId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setComponentCode(data.module.component_code);
      setEditedCode(data.module.component_code);
      setUiState("ready");
    } catch (e) {
      setError((e as Error).message);
      setUiState("error");
    }
  }

  async function handleSaveCode() {
    if (!editedCode) return;
    setSaving(true);
    try {
      const res = await fetch("/api/modules", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toolId: tool.id, componentCode: editedCode }),
      });
      if (!res.ok) throw new Error("저장 실패");
      setComponentCode(editedCode);
      setTab("ui");
    } finally {
      setSaving(false);
    }
  }

  const displayCode = tab === "code" ? (editedCode ?? "") : (componentCode ?? "");
  const codeChanged = editedCode !== componentCode;

  return (
    <div style={{ border: "1px solid #e5e7eb", borderRadius: 10, overflow: "hidden", background: "#fff" }}>
      {/* Header */}
      <button
        onClick={handleOpen}
        style={{
          width: "100%",
          padding: "14px 16px",
          textAlign: "left",
          background: "none",
          border: "none",
          cursor: "pointer",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 8,
        }}
      >
        <div>
          <div style={{ fontWeight: 600, fontSize: 15 }}>{tool.name}</div>
          {tool.description && (
            <div style={{ fontSize: 13, color: "#6b7280", marginTop: 2 }}>
              {tool.description}
            </div>
          )}
        </div>
        <span style={{ fontSize: 11, color: "#9ca3af", flexShrink: 0, marginTop: 2 }}>
          {open ? "▲" : "▼"}
        </span>
      </button>

      {open && (
        <div style={{ borderTop: "1px solid #f3f4f6" }}>
          {/* Toolbar */}
          {uiState === "ready" && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "8px 16px",
                background: "#f9fafb",
                borderBottom: "1px solid #f3f4f6",
                gap: 8,
              }}
            >
              {/* Tabs */}
              <div style={{ display: "flex", gap: 4 }}>
                {(["ui", "code"] as Tab[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    style={{
                      padding: "4px 10px",
                      fontSize: 12,
                      fontWeight: 500,
                      border: "1px solid",
                      borderColor: tab === t ? "#111827" : "#e5e7eb",
                      borderRadius: 6,
                      background: tab === t ? "#111827" : "none",
                      color: tab === t ? "#fff" : "#6b7280",
                      cursor: "pointer",
                    }}
                  >
                    {t === "ui" ? "UI" : "코드"}
                  </button>
                ))}
              </div>

              {/* Actions */}
              <div style={{ display: "flex", gap: 6 }}>
                {tab === "code" && codeChanged && (
                  <button
                    onClick={handleSaveCode}
                    disabled={saving}
                    style={{
                      padding: "4px 10px",
                      fontSize: 12,
                      fontWeight: 600,
                      background: "#059669",
                      color: "#fff",
                      border: "none",
                      borderRadius: 6,
                      cursor: "pointer",
                    }}
                  >
                    {saving ? "저장 중..." : "저장"}
                  </button>
                )}
                <button
                  onClick={handleRegenerate}
                  style={{
                    padding: "4px 10px",
                    fontSize: 12,
                    color: "#6b7280",
                    background: "none",
                    border: "1px solid #e5e7eb",
                    borderRadius: 6,
                    cursor: "pointer",
                  }}
                >
                  재생성
                </button>
              </div>
            </div>
          )}

          {/* Content */}
          <div style={{ padding: 16 }}>
            {uiState === "loading" && (
              <div style={{ color: "#6b7280", fontSize: 13, padding: "8px 0" }}>
                {componentCode ? "재생성 중..." : "UI 생성 중... (처음 한 번만 소요됩니다)"}
              </div>
            )}
            {uiState === "error" && (
              <div style={{ color: "#dc2626", fontSize: 13 }}>{error}</div>
            )}
            {uiState === "ready" && (
              <>
                {tab === "ui" && componentCode && (
                  <ModuleRenderer componentCode={componentCode} />
                )}
                {tab === "code" && (
                  <textarea
                    value={editedCode ?? ""}
                    onChange={(e) => setEditedCode(e.target.value)}
                    spellCheck={false}
                    style={{
                      width: "100%",
                      minHeight: 320,
                      fontFamily: "monospace",
                      fontSize: 12,
                      lineHeight: 1.6,
                      border: "1px solid #e5e7eb",
                      borderRadius: 6,
                      padding: 12,
                      resize: "vertical",
                      outline: "none",
                      background: "#1e1e1e",
                      color: "#d4d4d4",
                      boxSizing: "border-box",
                    }}
                  />
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
