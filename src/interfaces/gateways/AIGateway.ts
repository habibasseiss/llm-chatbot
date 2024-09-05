import { ChatHistory } from "@/domain/entities/Prompt";

export interface AIGateway {
  getAIResponse(chatHistory: ChatHistory): Promise<string>;
}
