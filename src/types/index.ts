export interface Server {
  id: string;
  url: string;
  name: string;
  description: string | null;
  created_at: number;
}

export interface Tool {
  id: string;
  server_id: string;
  name: string;
  description: string | null;
  input_schema: string; // JSON string
  created_at: number;
}

export interface Module {
  id: string;
  tool_id: string;
  component_code: string;
  claude_model: string;
  prompt_version: number;
  created_at: number;
  updated_at: number;
}

export interface ToolSchema {
  name: string;
  description?: string;
  inputSchema: Record<string, unknown>;
}
