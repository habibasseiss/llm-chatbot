import { ChatHistory } from "@/domain/entities/Prompt";

export interface AIGateway {
  getAIResponse(chatHistory: ChatHistory, llmModel?: string): Promise<string>;

  /// Returns true if the response is the final response in the conversation,
  /// i.e. contains [closed] in the response.
  isFinalResponse(response: string): boolean;

  /// Removes any metadata from the response, e.g. [closed].
  parseResponse(response: string): string;
}
