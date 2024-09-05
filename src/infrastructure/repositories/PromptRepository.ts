import { ChatHistory, Prompt } from "@/domain/entities/Prompt";
import { PromptRepository } from "@/interfaces/repositories/PromptRepository";

// TODO: Implement DatabasePromptRepository interface to interact with a database
export class InMemoryPromptRepository implements PromptRepository {
  private prompts: { [key: string]: Prompt[] } = {};

  async getPromptHistory(userId: string): Promise<ChatHistory> {
    return { messages: this.prompts[userId] || [] };
  }

  async savePrompt(prompt: Prompt): Promise<void> {
    if (!prompt.id) return;
    if (!this.prompts[prompt.id]) {
      this.prompts[prompt.id] = [];
    }
    this.prompts[prompt.id].push(prompt);
  }
}
