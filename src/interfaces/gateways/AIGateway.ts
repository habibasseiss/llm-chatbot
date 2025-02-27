import { ChatHistory } from "@/domain/entities/Prompt";
import { AIOptions } from "@/domain/types/LLMConfig";

export interface AIGateway {
  getAIResponse(
    chatHistory: ChatHistory,
    aiOptions: AIOptions
  ): Promise<string>;

  /// Generate a summary based on the chat history.
  getAISummary(chatHistory: ChatHistory, aiOptions: AIOptions): Promise<string>;
}
