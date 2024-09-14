import { ChatHistory, Role } from "@/domain/entities/Prompt";

export interface PromptRepository {
  getPromptHistory(userId: string): Promise<ChatHistory>;
  savePrompt({
    content,
    role,
    user_id,
    user_profile_name,
  }: {
    content: string;
    role: Role;
    user_id: string;
    user_profile_name?: string;
  }): Promise<void>;
}
