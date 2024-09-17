import { ChatHistory, Role } from "@/domain/entities/Prompt";

export interface PromptRepository {
  getPromptHistory(userId: string): Promise<ChatHistory>;
  savePrompt(
    promptData: {
      content: string;
      role: Role;
      user_id: string;
      user_profile_name?: string;
    },
    expiration_hours?: number,
  ): Promise<void>;
}
