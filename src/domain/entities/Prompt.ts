export interface Session {
  id: string;
  user_id: string;
  user_profile_name: string;
  created_at: Date;
}

export interface Prompt {
  id: string;
  role: Role;
  content: string;
  session: Session;
  created_at: Date;
}

export interface ChatHistory {
  messages: Array<Prompt>;
}

export type Role = "user" | "assistant" | "system";
