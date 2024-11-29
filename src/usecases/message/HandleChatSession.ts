import { PromptRepository } from "@/domain/repositories/PromptRepository";
import { AIGateway } from "@/interfaces/gateways/AIGateway";
import { APIGateway } from "@/interfaces/gateways/APIGateway";
import UseCase from "@/usecases/UseCase";

export class HandleChatSession implements UseCase {
  constructor(
    private aiGateway: AIGateway,
    private promptRepository: PromptRepository,
    private apiGateway: APIGateway,
  ) {}

  async execute(sessionId: string): Promise<string> {
    const chatHistory = await this.promptRepository.getPromptHistory(sessionId);
    const settings = await this.apiGateway.getSettings();

    // Request prompt to AI and ask for a summary in json format (returns string)
    const summary = await this.aiGateway.getAISummary(
      chatHistory,
      settings.llm_model,
    );

    // Close the session and save the final summary
    await this.promptRepository.closeSession(sessionId, summary);

    return summary;
  }
}
