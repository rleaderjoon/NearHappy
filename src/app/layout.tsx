import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NearHappy",
  description: "MCP Hub with AI-generated UI",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
