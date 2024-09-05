export interface Prompt {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
}

export interface ChatHistory {
  messages: Array<Prompt>;
}
