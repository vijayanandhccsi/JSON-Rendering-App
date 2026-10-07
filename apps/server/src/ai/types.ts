export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface ModelInfo {
  id: string;
  name: string;
  provider: "anthropic" | "google";
}

export interface TokenUsage {
  tokensIn: number;
  tokensOut: number;
  stopReason?: string;
}

export interface StreamCallbacks {
  onChunk: (text: string) => void;
  onDone: (usage: TokenUsage) => void;
  onError: (error: Error) => void;
}

export interface AIProviderAdapter {
  send(
    messages: ChatMessage[],
    systemPrompt: string | undefined,
    model: string,
    callbacks: StreamCallbacks
  ): Promise<void>;
}
