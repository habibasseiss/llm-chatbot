import { GenericMessage, GenericResponse, MessageSource } from "@/domain/entities/GenericMessage";
import { Message, Metadata, OptionList, WhatsAppWebhookEvent } from "@/domain/entities/Message";
import { MessageSourceAdapter } from "@/interfaces/adapters/MessageSourceAdapter";
import axios from "axios";

export class WhatsAppAdapter implements MessageSourceAdapter<WhatsAppWebhookEvent> {
  constructor(private graphApiToken: string) {}

  convertToGenericMessage(webhookEvent: WhatsAppWebhookEvent): GenericMessage {
    const message: Message = webhookEvent.messages[0];
    const contact = webhookEvent.contacts[0];
    
    let messageContent = "";
    if (message.type == "interactive") {
      if (message.interactive?.type == "button_reply") {
        messageContent = message.interactive?.button_reply?.title ?? "";
      }
      if (message.interactive?.type == "list_reply") {
        messageContent = message.interactive?.list_reply?.title ?? "";
      }
    } else {
      messageContent = message.text?.body ?? "";
    }

    return {
      id: message.id,
      userId: message.from,
      userName: contact?.profile?.name,
      content: messageContent,
      timestamp: message.timestamp,
      source: MessageSource.WHATSAPP,
      rawData: webhookEvent
    };
  }

  async sendResponse(originalMessage: GenericMessage, response: GenericResponse): Promise<void> {
    const webhookEvent = originalMessage.rawData as WhatsAppWebhookEvent;
    const message = webhookEvent.messages[0];
    const metadata = webhookEvent.metadata;
    
    await this.markMessageAsRead(message, metadata);
    
    if (response.options && response.options.length > 0) {
      await this.sendInteractiveMessage(message, metadata, response.content, { options: response.options });
    } else {
      await this.sendTextMessage(message, metadata, response.content);
    }
  }

  initialize(): void {
    // WhatsApp adapter is initialized through the webhook controller
    console.log("WhatsApp adapter initialized");
  }

  private async markMessageAsRead(message: Message, metadata: Metadata) {
    try {
      await axios.post(
        `https://graph.facebook.com/v17.0/${metadata.phone_number_id}/messages`,
        {
          messaging_product: "whatsapp",
          status: "read",
          message_id: message.id,
        },
        {
          headers: {
            Authorization: `Bearer ${this.graphApiToken}`,
            "Content-Type": "application/json",
          },
        },
      );
    } catch (error) {
      console.error("Error marking message as read:", error);
    }
  }

  private async sendTextMessage(message: Message, metadata: Metadata, text: string) {
    try {
      await axios.post(
        `https://graph.facebook.com/v17.0/${metadata.phone_number_id}/messages`,
        {
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: message.from,
          type: "text",
          text: {
            preview_url: false,
            body: text,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${this.graphApiToken}`,
            "Content-Type": "application/json",
          },
        },
      );
    } catch (error) {
      console.error("Error sending message:", error);
    }
  }

  private async sendInteractiveMessage(
    message: Message,
    metadata: Metadata,
    text: string,
    optionList: OptionList,
  ) {
    try {
      const rows = optionList.options.map((option, index) => ({
        id: `option_${index + 1}`,
        title: option,
      }));

      await axios.post(
        `https://graph.facebook.com/v17.0/${metadata.phone_number_id}/messages`,
        {
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: message.from,
          type: "interactive",
          interactive: {
            type: "list",
            header: {
              type: "text",
              text: "Options",
            },
            body: {
              text,
            },
            action: {
              button: "Select an option",
              sections: [
                {
                  rows,
                },
              ],
            },
          },
        },
        {
          headers: {
            Authorization: `Bearer ${this.graphApiToken}`,
            "Content-Type": "application/json",
          },
        },
      );
    } catch (error) {
      console.error("Error sending interactive message:", error);
    }
  }
}
