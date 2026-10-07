import Anthropic from "@anthropic-ai/sdk";
import type { AIProviderAdapter, ChatMessage, StreamCallbacks } from "./types.js";

export class AnthropicAdapter implements AIProviderAdapter {
  private client: Anthropic;

  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey });
  }

  async send(
    messages: ChatMessage[],
    systemPrompt: string | undefined,
    model: string,
    callbacks: StreamCallbacks
  ): Promise<void> {
    try {
      const formattedMessages = messages
        .filter((m) => m.role === "user" || m.role === "assistant")
        .map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        }));

      const stream = this.client.messages.stream({
        model,
        max_tokens: 4096,
        system: systemPrompt,
        messages: formattedMessages,
      });

      stream.on("text", (textDelta) => {
        callbacks.onChunk(textDelta);
      });

      const finalMessage = await stream.finalMessage();
      const tokensIn = finalMessage.usage?.input_tokens || 0;
      const tokensOut = finalMessage.usage?.output_tokens || 0;

      callbacks.onDone({ tokensIn, tokensOut });
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error(String(err));
      callbacks.onError(error);
    }
  }
}
