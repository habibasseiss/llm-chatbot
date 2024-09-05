export interface Prompt {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  user_id: string;
  user_profile_name: string;
}

export interface ChatHistory {
  messages: Array<Prompt>;
}
