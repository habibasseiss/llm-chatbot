import axios from "axios";
import { Message } from "../domain/entities/Message";

export class HandleIncomingMessage {
  constructor(
    private graphApiToken: string,
    private businessPhoneNumberId: string,
  ) {}

  async execute(message: Message) {
    try {
      await this.sendReply(message);
      await this.markMessageAsRead(message);
    } catch (error) {
      console.log(error);
    }
  }

  private async sendReply(message: Message) {
    await axios({
      method: "POST",
      url:
        `https://graph.facebook.com/v18.0/${this.businessPhoneNumberId}/messages`,
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

  private async markMessageAsRead(message: Message) {
    await axios({
      method: "POST",
      url:
        `https://graph.facebook.com/v18.0/${this.businessPhoneNumberId}/messages`,
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
