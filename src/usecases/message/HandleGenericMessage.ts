import {
  GenericMessage,
  GenericResponse,
  MessageSource,
} from "@/domain/entities/GenericMessage";
import { PromptRepository } from "@/domain/repositories/PromptRepository";
import { AIResponseParser } from "@/infrastructure/parsers/AIResponseParser";
import { MessageSourceAdapter } from "@/interfaces/adapters/MessageSourceAdapter";
import { AIGateway } from "@/interfaces/gateways/AIGateway";
import { APIGateway } from "@/interfaces/gateways/APIGateway";
import UseCase from "@/usecases/UseCase";

export class HandleGenericMessage implements UseCase {
  constructor(
    private aiGateway: AIGateway,
    private promptRepository: PromptRepository,
    private apiGateway: APIGateway,
    private adapters: Map<MessageSource, MessageSourceAdapter<any>>
  ) {}

  async execute(message: GenericMessage): Promise<void> {
    try {
      const settings = await this.apiGateway.getSettings();
      const adapter = this.adapters.get(message.source);

      if (!adapter) {
        console.error(`No adapter found for source: ${message.source}`);
        return;
      }

      // Initially, get the session id for the user. If the session has expired
      // or doesn't exist, it already creates a new one, so we always get an id.
      const sessionId = await this.promptRepository.getSessionId(
        message.userId,
        message.userName || `User-${message.userId}`,
        settings.session_duration
      );

      // Get the prompt history, and if it's the first interaction, store the
      // system prompt as the first message in the session
      let chatHistory = await this.promptRepository.getPromptHistory(sessionId);
      if (chatHistory.messages.length === 0) {
        await this.promptRepository.savePrompt({
          content: settings.system_prompt + "\n\nRespond in JSON.",
          role: "system",
          sessionId: sessionId,
        });
      }

      // Save the user interaction
      await this.promptRepository.savePrompt({
        content: message.content,
        role: "user",
        sessionId: sessionId,
      });

      // Get all the chat history for the current session
      chatHistory = await this.promptRepository.getPromptHistory(sessionId);

      // Get the AI response
      const aiResponse = await this.aiGateway.getAIResponse(
        chatHistory,
        settings.llm_config
      );
      console.log("Raw AI response:", aiResponse);

      // Parse the AI response, removing any metadata like [closed]
      let [responseText, isFinalResponse, optionList] =
        AIResponseParser.parse(aiResponse);

      // Save the AI response as assistant in the chat history
      await this.promptRepository.savePrompt({
        content: aiResponse,
        role: "assistant",
        sessionId: sessionId,
      });

      // Send the response to the user
      const genericResponse: GenericResponse = {
        content: responseText,
        options: optionList?.options,
        isFinalResponse: isFinalResponse,
      };

      await adapter.sendResponse(message, genericResponse);

      // If it's the final response, close the session
      if (isFinalResponse) {
        // Request another prompt to AI and ask for a summary in json format
        const summary = await this.aiGateway.getAISummary(
          chatHistory,
          settings.llm_config
        );

        // Close the session and save the final summary
        await this.promptRepository.closeSession(sessionId, summary);
      }
    } catch (error) {
      console.error("Error handling message:", error);
    }
  }
}
