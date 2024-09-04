export interface AIGateway {
  getAIResponse(message: string, role: "user" | "assistant"): Promise<string>;
}
