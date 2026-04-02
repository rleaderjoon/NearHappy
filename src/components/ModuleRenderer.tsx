"use client";

import React from "react";
import { LiveProvider, LiveError, LivePreview } from "react-live";

interface ModuleRendererProps {
  componentCode: string;
}

const scope = {
  React,
  useState: React.useState,
  useEffect: React.useEffect,
  fetch,
};

export default function ModuleRenderer({ componentCode }: ModuleRendererProps) {
  return (
    <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: 16 }}>
      <LiveProvider code={componentCode} noInline scope={scope}>
        <LiveError
          style={{
            color: "#dc2626",
            background: "#fef2f2",
            padding: 8,
            borderRadius: 4,
            fontSize: 13,
            marginBottom: 8,
            whiteSpace: "pre-wrap",
          }}
        />
        <LivePreview />
      </LiveProvider>
    </div>
  );
}
