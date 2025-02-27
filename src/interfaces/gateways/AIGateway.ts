import { ChatHistory } from "@/domain/entities/Prompt";

export interface AIGateway {
  getAIResponse(chatHistory: ChatHistory, llmModel?: string): Promise<string>;

  /// Generate a summary based on the chat history.
  getAISummary(chatHistory: ChatHistory, llmModel?: string): Promise<string>;
}
