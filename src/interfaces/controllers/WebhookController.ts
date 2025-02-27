import {
  Message,
  Metadata,
  WhatsAppWebhookEvent,
} from "@/domain/entities/Message";
import { WhatsAppAdapter } from "@/infrastructure/adapters/WhatsAppAdapter";
import { HandleGenericMessage } from "@/usecases/message/HandleGenericMessage";
import { Request, Response } from "express";

export class WebhookController {
  private whatsAppAdapter: WhatsAppAdapter;

  constructor(
    private handleGenericMessage: HandleGenericMessage,
    private graphApiToken: string
  ) {
    this.whatsAppAdapter = new WhatsAppAdapter(graphApiToken);
  }

  async handleWebhook(req: Request, res: Response) {
    console.log("Incoming webhook message:", JSON.stringify(req.body, null, 2));

    const webhookEvent: WhatsAppWebhookEvent =
      req.body.entry?.[0]?.changes?.[0]?.value;
    const message: Message | undefined = webhookEvent?.messages?.[0];
    const metadata: Metadata | undefined = webhookEvent?.metadata;

    if (message && metadata) {
      const genericMessage =
        this.whatsAppAdapter.convertToGenericMessage(webhookEvent);
      await this.handleGenericMessage.execute(genericMessage);
    }

    res.sendStatus(200);
  }

  verifyWebhook(req: Request, res: Response) {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    if (mode === "subscribe" && token === process.env.WEBHOOK_VERIFY_TOKEN) {
      res.status(200).send(challenge);
      console.log("Webhook verified successfully!");
    } else {
      res.sendStatus(403);
    }
  }
}
