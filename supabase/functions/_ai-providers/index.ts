import { AnthropicAdapter } from "./anthropic.ts";
import { GoogleVertexAdapter } from "./google-vertex.ts";
import { OpenAIAdapter } from "./openai.ts";
import type {
  AiTask,
  AiTier,
  ModelCall,
  Provider,
  ProviderAdapter,
  TierConfig,
} from "./types.ts";
import { pickTaskCall } from "./types.ts";

/** Load the full combo row for a tier. Throws if missing. */
export async function loadTierConfig(supabase: any, tier: AiTier): Promise<TierConfig> {
  const { data, error } = await supabase
    .from("ai_model_config")
    .select("*")
    .eq("tier", tier)
    .single();
  if (error || !data) {
    throw new Error(`AI combo config missing for tier '${tier}': ${error?.message ?? "not found"}`);
  }
  return data as TierConfig;
}

/** Convenience: load the tier combo and pre-extract one task's ModelCall. */
export async function loadTaskCall(
  supabase: any,
  tier: AiTier,
  task: AiTask
): Promise<{ tierConfig: TierConfig; call: ModelCall }> {
  const tierConfig = await loadTierConfig(supabase, tier);
  return { tierConfig, call: pickTaskCall(tierConfig, task) };
}

/** Return an adapter instance for a provider. */
export function getAdapter(provider: Provider, supabase: any): ProviderAdapter {
  switch (provider) {
    case "anthropic":
      return new AnthropicAdapter();
    case "google_vertex":
      return new GoogleVertexAdapter(supabase);
    case "openai":
      return new OpenAIAdapter();
  }
}

export { aiModelToTier, pickTaskCall } from "./types.ts";
export type {
  AiTask,
  AiTier,
  ChatMessage,
  ModelCall,
  Provider,
  StreamChunk,
  TierConfig,
} from "./types.ts";
