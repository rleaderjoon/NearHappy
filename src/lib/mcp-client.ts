import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import type { ToolSchema } from "@/types";

export interface DiscoveryResult {
  serverName: string;
  serverDescription?: string;
  tools: ToolSchema[];
}

export async function discoverTools(url: string): Promise<DiscoveryResult> {
  const client = new Client(
    { name: "nearhappy-hub", version: "0.1.0" },
    { capabilities: {} }
  );

  let connected = false;

  // Try StreamableHTTP first (current MCP spec)
  try {
    const transport = new StreamableHTTPClientTransport(new URL(url));
    await client.connect(transport);
    connected = true;
  } catch {
    // Fallback to SSE for older servers
  }

  if (!connected) {
    const sseUrl = url.endsWith("/sse") ? url : `${url}/sse`;
    const transport = new SSEClientTransport(new URL(sseUrl));
    await client.connect(transport);
  }

  const { tools } = await client.listTools();
  await client.close();

  const serverInfo = client.getServerVersion();

  return {
    serverName: serverInfo?.name ?? new URL(url).hostname,
    serverDescription: undefined,
    tools: tools.map((t) => ({
      name: t.name,
      description: t.description,
      inputSchema: (t.inputSchema as Record<string, unknown>) ?? {},
    })),
  };
}

export async function invokeTool(
  serverUrl: string,
  toolName: string,
  args: Record<string, unknown>
): Promise<unknown> {
  const client = new Client(
    { name: "nearhappy-hub", version: "0.1.0" },
    { capabilities: {} }
  );

  let connected = false;

  try {
    const transport = new StreamableHTTPClientTransport(new URL(serverUrl));
    await client.connect(transport);
    connected = true;
  } catch {
    // ignore
  }

  if (!connected) {
    const sseUrl = serverUrl.endsWith("/sse")
      ? serverUrl
      : `${serverUrl}/sse`;
    const transport = new SSEClientTransport(new URL(sseUrl));
    await client.connect(transport);
  }

  const result = await client.callTool({ name: toolName, arguments: args });
  await client.close();

  return result;
}
