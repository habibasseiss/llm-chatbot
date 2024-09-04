import { Message, Metadata } from "@/domain/entities/Message";
import { AIGateway } from "@/interfaces/gateways/AIGateway";
import axios from "axios";

export class HandleIncomingMessage {
  constructor(
    private graphApiToken: string,
    private aiGateway: AIGateway,
  ) {}

  async execute(message: Message, metadata: Metadata) {
    try {
      await this.markMessageAsRead(message, metadata);

      // Get AI response
      const aiResponse = await this.aiGateway.getAIResponse(
        message.text.body,
        "user",
      );

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
