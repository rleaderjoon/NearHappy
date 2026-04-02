import OpenAI from "openai";
import type { Tool } from "@/types";

export const PROMPT_VERSION = 2;
export const CLAUDE_MODEL = "gpt-4o-mini";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `You are an HTML page generator. Given an MCP tool's name, description, and JSON Schema, generate a complete HTML page.

REQUIREMENTS:
- Full HTML document (<!DOCTYPE html> ... </html>)
- Include Alpine.js via CDN in <head>: <script src="https://unpkg.com/alpinejs@3/dist/cdn.min.js" defer></script>
- Include Tailwind CSS via CDN in <head>: <script src="https://cdn.tailwindcss.com"></script>
- Use Alpine.js (x-data, x-model, @submit.prevent, x-show, x-text) for all interactivity
- Use Tailwind utility classes for all styling — make it look clean and modern
- On form submit, call: fetch('/api/tools/invoke', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ serverId: SERVER_ID, toolName: TOOL_NAME, args: {...} }) })
- Show loading state during fetch
- Display result: if object/array use JSON.stringify with indent, else plain text
- Show error message if fetch fails or response is not ok
- Map JSON Schema types to inputs: string→text, number→number, boolean→checkbox, enum→select
- body should have class="bg-gray-50 p-6 font-sans"

Output ONLY the HTML. No markdown fences, no explanation.`;

export async function generateToolComponent(
  tool: Tool,
  serverId: string
): Promise<string> {
  const inputSchema = JSON.parse(tool.input_schema);

  const userMessage = `Tool name: ${tool.name}
Description: ${tool.description ?? "No description provided"}

Input schema:
${JSON.stringify(inputSchema, null, 2)}

serverId value: "${serverId}"
toolName value: "${tool.name}"`;

  const response = await client.chat.completions.create({
    model: CLAUDE_MODEL,
    max_tokens: 2000,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userMessage },
    ],
  });

  const text = response.choices[0]?.message?.content ?? "";

  return text
    .replace(/^```[a-z]*\n?/m, "")
    .replace(/\n?```$/m, "")
    .trim();
}
