import axios from "axios";
import { Message, Metadata } from "../domain/entities/Message";

export class HandleIncomingMessage {
  constructor(
    private graphApiToken: string,
  ) {}

  async execute(message: Message, metadata: Metadata) {
    try {
      await this.markMessageAsRead(message, metadata);
      await this.sendReply(message, metadata);
    } catch (error) {
      console.log(JSON.stringify(error, null, 2));
    }
  }

  private async sendReply(
    message: Message,
    metadata: Metadata,
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
        text: { body: "Echo: " + message.text.body },
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
