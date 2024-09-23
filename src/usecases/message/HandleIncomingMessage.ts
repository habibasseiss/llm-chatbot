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

      let chatHistory = await this.promptRepository.getPromptHistory(userId);
      if (chatHistory.messages.length === 0) {
        await this.promptRepository.savePrompt({
          content: settings.system_prompt,
          role: "system",
          user_id: userId,
          user_profile_name: webhookEvent?.contacts[0]?.profile?.name,
        }, settings.session_duration);
        chatHistory = await this.promptRepository.getPromptHistory(userId);
      }

      await this.promptRepository.savePrompt({
        content: message.text!.body,
        role: "user",
        user_id: userId,
        user_profile_name: webhookEvent?.contacts[0]?.profile?.name,
      }, settings.session_duration);

      chatHistory = await this.promptRepository.getPromptHistory(userId);

      const aiResponse = await this.aiGateway.getAIResponse(
        chatHistory,
        settings.llm_model,
      );

      await this.promptRepository.savePrompt({
        content: aiResponse,
        role: "assistant",
        user_id: userId,
        user_profile_name: webhookEvent?.contacts[0]?.profile?.name,
      }, settings.session_duration);

      await this.sendReply(message, metadata, aiResponse);
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
