import { Message, Metadata } from "@/domain/entities/Message";
import { ChatHistory } from "@/domain/entities/Prompt";
import { AIGateway } from "@/interfaces/gateways/AIGateway";
import { PromptRepository } from "@/interfaces/repositories/PromptRepository";
import axios from "axios";

export class HandleIncomingMessage {
  constructor(
    private graphApiToken: string,
    private aiGateway: AIGateway,
    private promptRepository: PromptRepository,
  ) {}

  async execute(message: Message, metadata: Metadata) {
    try {
      await this.markMessageAsRead(message, metadata);

      // TODO: get prompt history from database
      // const messageHistory = await this.promptRepository.getPromptHistory(
      //   message.from,
      // );

      const chatHistory: ChatHistory = {
        messages: [
          {
            id: "xxx",
            role: "user",
            content: message.text.body,
          },
        ],
      };

      // Get AI response
      const aiResponse = await this.aiGateway.getAIResponse(chatHistory);

      // Send AI response as a reply
      await this.sendReply(message, metadata, aiResponse);
    } catch (error) {
      console.log(JSON.stringify(error, null, 2));
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
