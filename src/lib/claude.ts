import OpenAI from "openai";
import type { Tool } from "@/types";

export const PROMPT_VERSION = 1;
export const CLAUDE_MODEL = "gpt-4o-mini";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `You are a React component generator. Given an MCP tool's name, description, and JSON Schema, generate a single React component.

The component MUST follow these rules:
- NO import statements
- NO export statements
- Use only: React, useState, useEffect, fetch (pre-loaded in scope)
- Use inline styles only (no Tailwind classes, they won't work)
- Component name MUST be ToolUI
- Last line MUST be: render(<ToolUI />)
- On form submit, call POST /api/tools/invoke with body: { serverId, toolName, args }
- Show loading state while waiting for result
- Display result clearly (JSON.stringify for objects, plain text otherwise)
- Show error messages if the call fails
- Map JSON Schema types: string→<input type="text">, number→<input type="number">, boolean→<input type="checkbox">, array of strings with enum→<select>
- Keep component under 120 lines
- Use a clean, minimal aesthetic with subtle borders and padding

Output ONLY the component code. No markdown fences, no explanation.`;

export async function generateToolComponent(
  tool: Tool,
  serverId: string
): Promise<string> {
  const inputSchema = JSON.parse(tool.input_schema);

  const userMessage = `Tool name: ${tool.name}
Description: ${tool.description ?? "No description provided"}

Input schema:
${JSON.stringify(inputSchema, null, 2)}

Server ID for API calls: ${serverId}`;

  const response = await client.chat.completions.create({
    model: CLAUDE_MODEL,
    max_tokens: 2000,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userMessage },
    ],
  });

  const text = response.choices[0]?.message?.content ?? "";

  // Strip any accidental markdown fences
  return text
    .replace(/^```[a-z]*\n?/m, "")
    .replace(/\n?```$/m, "")
    .trim();
}
