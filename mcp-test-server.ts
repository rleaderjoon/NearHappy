import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";
import http from "http";

const server = new McpServer({
  name: "test-server",
  version: "0.1.0",
});

// Tool 1: 두 숫자 더하기
server.tool(
  "add",
  "두 숫자를 더합니다",
  {
    a: z.number().describe("첫 번째 숫자"),
    b: z.number().describe("두 번째 숫자"),
  },
  async ({ a, b }) => ({
    content: [{ type: "text", text: String(a + b) }],
  })
);

// Tool 2: 텍스트 글자 수 세기
server.tool(
  "count_characters",
  "텍스트의 글자 수를 셉니다",
  {
    text: z.string().describe("글자 수를 셀 텍스트"),
  },
  async ({ text }) => ({
    content: [
      {
        type: "text",
        text: JSON.stringify({
          total: text.length,
          letters: text.replace(/\s/g, "").length,
          words: text.trim().split(/\s+/).filter(Boolean).length,
        }),
      },
    ],
  })
);

// Tool 3: 환율 계산 (가짜 고정 환율)
server.tool(
  "convert_currency",
  "통화를 변환합니다 (테스트용 고정 환율)",
  {
    amount: z.number().describe("변환할 금액"),
    from: z
      .enum(["KRW", "USD", "JPY", "EUR"])
      .describe("원본 통화"),
    to: z
      .enum(["KRW", "USD", "JPY", "EUR"])
      .describe("변환할 통화"),
  },
  async ({ amount, from, to }) => {
    const toUSD: Record<string, number> = {
      KRW: 1 / 1350,
      USD: 1,
      JPY: 1 / 150,
      EUR: 1.1,
    };
    const usd = amount * toUSD[from];
    const result = usd / toUSD[to];
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            from: `${amount} ${from}`,
            to: `${result.toFixed(2)} ${to}`,
            rate: (toUSD[from] / toUSD[to]).toFixed(6),
          }),
        },
      ],
    };
  }
);

// HTTP 서버로 서빙
const httpServer = http.createServer(async (req, res) => {
  if (req.method === "POST" && req.url === "/") {
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
    });

    res.on("close", () => transport.close());
    await server.connect(transport);
    await transport.handleRequest(req, res);
    return;
  }

  res.writeHead(404);
  res.end("Not found");
});

const PORT = 3001;
httpServer.listen(PORT, () => {
  console.log(`MCP test server running at http://localhost:${PORT}`);
  console.log("Tools: add, count_characters, convert_currency");
});
