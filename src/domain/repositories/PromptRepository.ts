import { ChatHistory, Role } from "@/domain/entities/Prompt";

export interface PromptRepository {
  getSessionId(
    userId: string,
    userProfileName: string,
    expiration_hours?: number
  ): Promise<string>;

  getPromptHistory(sessionId: string): Promise<ChatHistory>;

  savePrompt(promptData: {
    content: string;
    role: Role;
    sessionId: string;
  }): Promise<void>;

  closeSession(sessionId: string, summary?: string): Promise<void>;
}
