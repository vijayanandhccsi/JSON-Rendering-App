import { config } from "../config.js";
import { AnthropicAdapter } from "./anthropic.js";
import { GeminiAdapter } from "./gemini.js";
import type { AIProviderAdapter, ModelInfo } from "./types.js";

const ALL_MODELS: (ModelInfo & { default?: boolean })[] = [
  {
    id: "claude-3-5-sonnet-20241022",
    name: "Claude 3.5 Sonnet",
    provider: "anthropic",
    default: true,
  },
  {
    id: "claude-3-5-haiku-20241022",
    name: "Claude 3.5 Haiku",
    provider: "anthropic",
  },
  {
    id: "gemini-2.5-flash",
    name: "Gemini 2.5 Flash",
    provider: "google",
  },
  {
    id: "gemini-2.5-pro",
    name: "Gemini 2.5 Pro",
    provider: "google",
  },
];

export function getAvailableModels(): ModelInfo[] {
  const hasAnthropic = Boolean(config.anthropicApiKey && config.anthropicApiKey.trim() !== "");
  const hasGemini = Boolean(config.geminiApiKey && config.geminiApiKey.trim() !== "");

  return ALL_MODELS.filter((model) => {
    if (model.provider === "anthropic") return hasAnthropic;
    if (model.provider === "google") return hasGemini;
    return false;
  }).map(({ id, name, provider }) => ({ id, name, provider }));
}

export function getAdapterForModel(modelId: string): { adapter: AIProviderAdapter; modelId: string } {
  const modelInfo = ALL_MODELS.find((m) => m.id === modelId);

  if (!modelInfo) {
    throw new Error(`Unsupported model ID: "${modelId}"`);
  }

  if (modelInfo.provider === "anthropic") {
    if (!config.anthropicApiKey) {
      throw new Error(`Anthropic API key is not configured in .env`);
    }
    return { adapter: new AnthropicAdapter(config.anthropicApiKey), modelId: modelInfo.id };
  }

  if (modelInfo.provider === "google") {
    if (!config.geminiApiKey) {
      throw new Error(`Gemini API key is not configured in .env`);
    }
    return { adapter: new GeminiAdapter(config.geminiApiKey), modelId: modelInfo.id };
  }

  throw new Error(`Unknown provider for model: "${modelId}"`);
}
