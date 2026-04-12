// Shared types for AI provider adapters.
// Edge functions import these via relative paths (e.g. '../_ai-providers/types.ts').

export type Provider = 'anthropic' | 'google_vertex' | 'openai';
export type AiTier = 'standard' | 'advanced' | 'precision' | 'premium';
export type AiTask = 'intake' | 'summary' | 'diagnostic' | 'document' | 'scan';

/** One row from ai_plan_config — per-plan config for org-level tasks. */
export interface PlanConfig {
  plan: string;
  document_provider: Provider;
  document_model: string;
  document_model_display: string;
  document_max_tokens: number;
  document_temperature: number;
  scan_provider: Provider;
  scan_model: string;
  scan_model_display: string;
  scan_max_tokens: number;
  scan_temperature: number;
}

/** Extract a ModelCall for a plan-level task from a PlanConfig row. */
export function pickPlanTaskCall(config: PlanConfig, task: 'document' | 'scan'): ModelCall {
  switch (task) {
    case 'document':
      return {
        provider: config.document_provider,
        model: config.document_model,
        max_tokens: config.document_max_tokens,
        temperature: config.document_temperature,
      };
    case 'scan':
      return {
        provider: config.scan_provider,
        model: config.scan_model,
        max_tokens: config.scan_max_tokens,
        temperature: config.scan_temperature,
      };
  }
}

/** One row from ai_model_config — the full combo for a tier. */
export interface TierConfig {
  tier: AiTier;
  display_name: string;
  credit_cost: number;

  intake_provider: Provider;
  intake_model: string;
  intake_model_display: string;
  intake_max_tokens: number;
  intake_temperature: number;

  summary_provider: Provider;
  summary_model: string;
  summary_model_display: string;
  summary_max_tokens: number;
  summary_temperature: number;

  diagnostic_provider: Provider;
  diagnostic_model: string;
  diagnostic_model_display: string;
  diagnostic_max_tokens: number;
  diagnostic_temperature: number;
}

/** The subset of config fields an adapter needs for one task. */
export interface ModelCall {
  provider: Provider;
  model: string;
  max_tokens: number;
  temperature: number;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface StreamChunk {
  type: 'delta' | 'done' | 'error';
  text?: string;
  error?: string;
}

export interface ProviderAdapter {
  streamChat(opts: {
    call: ModelCall;
    system: string;
    /**
     * Optional: number of characters at the start of `system` that are stable
     * across turns and should be prompt-cached. Anthropic uses this to set a
     * cache breakpoint; other providers get implicit/automatic caching and
     * ignore this hint.
     */
    systemCachePrefix?: number;
    messages: ChatMessage[];
  }): AsyncIterable<StreamChunk>;

  structuredOutput(opts: {
    call: ModelCall;
    system: string;
    systemCachePrefix?: number;
    messages: ChatMessage[];
  }): Promise<{
    json: unknown;
    rawText: string;
    usage?: { input_tokens: number; output_tokens: number };
  }>;
}

/** Resolve a DB ai_model value to a tier. Defaults to standard for unknown/null. */
export function aiModelToTier(aiModel: string | null | undefined): AiTier {
  if (aiModel === 'premium')   return 'premium';
  if (aiModel === 'precision') return 'precision';
  if (aiModel === 'advanced')  return 'advanced';
  return 'standard';
}

/** Extract a ModelCall for a specific task from the full TierConfig row. */
export function pickTaskCall(tierConfig: TierConfig, task: AiTask): ModelCall {
  switch (task) {
    case 'intake':
      return {
        provider: tierConfig.intake_provider,
        model: tierConfig.intake_model,
        max_tokens: tierConfig.intake_max_tokens,
        temperature: tierConfig.intake_temperature,
      };
    case 'summary':
      return {
        provider: tierConfig.summary_provider,
        model: tierConfig.summary_model,
        max_tokens: tierConfig.summary_max_tokens,
        temperature: tierConfig.summary_temperature,
      };
    case 'diagnostic':
      return {
        provider: tierConfig.diagnostic_provider,
        model: tierConfig.diagnostic_model,
        max_tokens: tierConfig.diagnostic_max_tokens,
        temperature: tierConfig.diagnostic_temperature,
      };
  }
}
