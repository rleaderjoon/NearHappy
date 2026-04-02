import { nanoid } from "nanoid";
import { getModuleByToolId, getToolById, upsertModule } from "@/lib/db";
import { generateToolComponent, CLAUDE_MODEL, PROMPT_VERSION } from "@/lib/claude";
import type { Module } from "@/types";

async function buildModule(toolId: string, serverId: string, existingId?: string): Promise<Module> {
  const tool = getToolById(toolId);
  if (!tool) throw new Error(`Tool ${toolId} not found`);

  const componentCode = await generateToolComponent(tool, serverId);

  const now = Date.now();
  const mod: Module = {
    id: existingId ?? nanoid(),
    tool_id: toolId,
    component_code: componentCode,
    claude_model: CLAUDE_MODEL,
    prompt_version: PROMPT_VERSION,
    created_at: now,
    updated_at: now,
  };

  upsertModule(mod);
  return mod;
}

export async function getOrCreateModule(
  toolId: string,
  serverId: string
): Promise<Module> {
  const existing = getModuleByToolId(toolId);
  if (existing) return existing;
  return buildModule(toolId, serverId);
}

export async function regenerateModule(
  toolId: string,
  serverId: string
): Promise<Module> {
  const existing = getModuleByToolId(toolId);
  return buildModule(toolId, serverId, existing?.id);
}
