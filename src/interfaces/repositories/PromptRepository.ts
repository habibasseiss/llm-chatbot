import { ChatHistory, Prompt } from "@/domain/entities/Prompt";

export interface PromptRepository {
  getPromptHistory(userId: string): Promise<ChatHistory>;
  savePrompt(prompt: Prompt): Promise<void>;
}
