import {
  Message,
  Metadata,
  WhatsAppWebhookEvent,
} from "@/domain/entities/Message";
import { AIGateway } from "@/interfaces/gateways/AIGateway";
import { PromptRepository } from "@/interfaces/repositories/PromptRepository";
import axios from "axios";

export class HandleIncomingMessage {
  constructor(
    private graphApiToken: string,
    private aiGateway: AIGateway,
    private promptRepository: PromptRepository,
  ) {}

  async execute(webhookEvent: WhatsAppWebhookEvent) {
    try {
      const message: Message | undefined = webhookEvent?.messages?.[0];
      const metadata: Metadata | undefined = webhookEvent?.metadata;

      await this.markMessageAsRead(message, metadata);

      const chatHistory = await this.promptRepository.getPromptHistory(
        message.from,
      );

      const aiResponse = await this.aiGateway.getAIResponse(chatHistory);

      await this.promptRepository.savePrompt({
        content: message.text!.body,
        role: "user",
        user_id: message.from,
        user_profile_name: webhookEvent?.contacts[0]?.profile?.name,
      });

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
        context: {
          message_id: message.id,
        },
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
