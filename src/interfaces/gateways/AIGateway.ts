export interface AIGateway {
  getAIResponse(message: string): Promise<string>;
}
