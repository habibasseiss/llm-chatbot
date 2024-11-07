import {
  Message,
  Metadata,
  WhatsAppWebhookEvent,
} from "@/domain/entities/Message";
import { PromptRepository } from "@/domain/repositories/PromptRepository";
import { AIGateway } from "@/interfaces/gateways/AIGateway";
import { APIGateway } from "@/interfaces/gateways/APIGateway";
import UseCase from "@/usecases/UseCase";
import axios from "axios";

export class HandleIncomingMessage implements UseCase {
  constructor(
    private graphApiToken: string,
    private aiGateway: AIGateway,
    private promptRepository: PromptRepository,
    private apiGateway: APIGateway,
  ) {}

  async execute(webhookEvent: WhatsAppWebhookEvent) {
    try {
      const message: Message | undefined = webhookEvent?.messages?.[0];
      const metadata: Metadata | undefined = webhookEvent?.metadata;
      const userId = message.from;
      const settings = await this.apiGateway.getSettings();

      await this.markMessageAsRead(message, metadata);

      // Initially, get the session id for the user. If the session has expired
      // or doesn't exist, it already creates a new one, so we always get an id.
      const sessionId = await this.promptRepository.getSessionId(
        userId,
        webhookEvent?.contacts[0]?.profile?.name,
        settings.session_duration,
      );

      // Get the prompt history, and if it's the first interaction, store the
      // system prompt as the first message in the session
      let chatHistory = await this.promptRepository.getPromptHistory(sessionId);
      if (chatHistory.messages.length === 0) {
        await this.promptRepository.savePrompt({
          content: settings.system_prompt,
          role: "system",
          sessionId: sessionId,
        });
      }

      // Save the user interaction
      await this.promptRepository.savePrompt({
        content: message.text!.body,
        role: "user",
        sessionId: sessionId,
      });

      // Get all the chat history for the current session
      chatHistory = await this.promptRepository.getPromptHistory(sessionId);

      // Get the AI response and check if it's the final response
      let aiResponse = await this.aiGateway.getAIResponse(
        chatHistory,
        settings.llm_model,
      );
      const isFinalResponse = this.aiGateway.isFinalResponse(aiResponse);

      // Parse the AI response, removing any metadata like [closed]
      aiResponse = this.aiGateway.parseResponse(aiResponse);

      // Save the AI response as assistant in the chat history
      await this.promptRepository.savePrompt({
        content: aiResponse,
        role: "assistant",
        sessionId: sessionId,
      });

      // Send the response to the user
      await this.sendReply(message, metadata, aiResponse);

      // If it's the final response, close the session
      if (isFinalResponse) {
        // Request another prompt to AI and ask for a summary in json format
        const summary = await this.aiGateway.getFinalAISummary(
          aiResponse,
          settings.llm_model,
        );

        await this.promptRepository.closeSession(sessionId, summary);
      }
    } catch (error) {
      console.log(error);
    }
  }

  private async sendReply(
    message: Message,
    metadata: Metadata,
    aiResponse: string,
  ) {
    await axios({
      method: "POST",
      url:
        `https://graph.facebook.com/v18.0/${metadata.phone_number_id}/messages`,
      headers: {
        Authorization: `Bearer ${this.graphApiToken}`,
      },
      data: {
        messaging_product: "whatsapp",
        to: message.from,
        text: { body: aiResponse },
      },
    });
  }

  private async markMessageAsRead(message: Message, metadata: Metadata) {
    await axios({
      method: "POST",
      url:
        `https://graph.facebook.com/v18.0/${metadata.phone_number_id}/messages`,
      headers: {
        Authorization: `Bearer ${this.graphApiToken}`,
      },
      data: {
        messaging_product: "whatsapp",
        status: "read",
        message_id: message.id,
      },
    });
  }
}
