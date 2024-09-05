export interface Prompt {
  id: string;
  role: Role;
  content: string;
  user_id: string;
  user_profile_name: string;
}

export interface ChatHistory {
  messages: Array<Prompt>;
}

export type Role = "user" | "assistant" | "system";
