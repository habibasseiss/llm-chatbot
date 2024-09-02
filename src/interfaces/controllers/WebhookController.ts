import { Request, Response } from "express";
import { Message, Metadata } from "../../domain/entities/Message";
import { HandleIncomingMessage } from "../../usecases/HandleIncomingMessage";

export class WebhookController {
  constructor(private handleIncomingMessage: HandleIncomingMessage) {}

  async handleWebhook(req: Request, res: Response) {
    console.log("Incoming webhook message:", JSON.stringify(req.body, null, 2));

    const message: Message | undefined = req.body.entry?.[0]?.changes?.[0]
      ?.value?.messages?.[0];
    const metadata: Metadata | undefined = req.body.entry?.[0]?.changes?.[0]
      ?.value?.metadata;

    if (message && metadata) {
      await this.handleIncomingMessage.execute(message, metadata);
    }

    res.sendStatus(200);
  }

  verifyWebhook(req: Request, res: Response) {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    if (
      mode === "subscribe" &&
      token === process.env.WEBHOOK_VERIFY_TOKEN
    ) {
      res.status(200).send(challenge);
      console.log("Webhook verified successfully!");
    } else {
      res.sendStatus(403);
    }
  }
}
