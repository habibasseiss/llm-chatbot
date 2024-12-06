import { OptionList } from "@/domain/entities/Message";
import { ChatHistory } from "@/domain/entities/Prompt";

export interface AIGateway {
  getAIResponse(chatHistory: ChatHistory, llmModel?: string): Promise<string>;

  /// Generate a summary based on the chat history.
  getAISummary(
    chatHistory: ChatHistory,
    llmModel?: string,
  ): Promise<string>;

  /// Returns multiple values: a string to reply to the user (where parsing for
  /// metadata like [options] will occur), a boolean that indicates if the
  /// response is the final response in the conversation (contains [closed] in
  /// the response), and an optional list of options for interactive messages.
  parseResponse(response: string): [string, boolean, OptionList];
}
