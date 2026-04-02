"use client";

import { useRef, useEffect } from "react";

interface ModuleRendererProps {
  componentCode: string;
}

export default function ModuleRenderer({ componentCode }: ModuleRendererProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // iframe 컨텐츠 높이에 맞게 자동 리사이즈
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    function resize() {
      try {
        const height = iframe!.contentDocument?.body?.scrollHeight;
        if (height) iframe!.style.height = height + 32 + "px";
      } catch {
        // cross-origin 예외 무시
      }
    }

    iframe.addEventListener("load", resize);
    return () => iframe.removeEventListener("load", resize);
  }, [componentCode]);

  return (
    <iframe
      ref={iframeRef}
      srcDoc={componentCode}
      sandbox="allow-scripts allow-same-origin allow-forms"
      style={{
        width: "100%",
        border: "none",
        minHeight: 200,
        display: "block",
      }}
    />
  );
}
