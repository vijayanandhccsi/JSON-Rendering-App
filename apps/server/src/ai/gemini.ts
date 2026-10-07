import { GoogleGenAI } from "@google/genai";
import type { AIProviderAdapter, ChatMessage, StreamCallbacks } from "./types.js";

export class GeminiAdapter implements AIProviderAdapter {
  private ai: GoogleGenAI;

  constructor(apiKey: string) {
    this.ai = new GoogleGenAI({ apiKey });
  }

  async send(
    messages: ChatMessage[],
    systemPrompt: string | undefined,
    model: string,
    callbacks: StreamCallbacks
  ): Promise<void> {
    try {
      const formattedContents = messages
        .filter((m) => m.role === "user" || m.role === "assistant")
        .map((m) => ({
          role: m.role === "user" ? "user" : "model",
          parts: [{ text: m.content }],
        }));

      const responseStream = await this.ai.models.generateContentStream({
        model,
        contents: formattedContents,
        config: systemPrompt ? { systemInstruction: systemPrompt } : undefined,
      });

      let tokensIn = 0;
      let tokensOut = 0;

      for await (const chunk of responseStream) {
        if (chunk.text) {
          callbacks.onChunk(chunk.text);
        }
        if (chunk.usageMetadata) {
          tokensIn = chunk.usageMetadata.promptTokenCount || tokensIn;
          tokensOut = chunk.usageMetadata.candidatesTokenCount || tokensOut;
        }
      }

      callbacks.onDone({ tokensIn, tokensOut });
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error(String(err));
      callbacks.onError(error);
    }
  }
}
