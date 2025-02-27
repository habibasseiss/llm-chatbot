import { ApiController } from "@/interfaces/controllers/ApiController";
import { WebhookController } from "@/interfaces/controllers/WebhookController";
import express from "express";

export class ExpressServer {
  private app = express();

  constructor(
    private webhookController: WebhookController,
    private apiController: ApiController
  ) {
    this.app.use(express.json());
    this.setupRoutes();
  }

  private setupRoutes() {
    this.app.post("/webhook", (req, res) =>
      this.webhookController.handleWebhook(req, res)
    );

    this.app.get("/webhook", (req, res) =>
      this.webhookController.verifyWebhook(req, res)
    );

    this.app.get("/session/summary/:sessionId", (req, res) =>
      this.apiController.handleGenerateSummary(req, res)
    );

    this.app.get("/", (req, res) => {
      res.send(`<pre>Nothing to see here.</pre>`);
    });
  }

  start(port: number) {
    this.app.listen(port, "0.0.0.0", () => {
      console.log(`Server is listening on port: ${port}`);
    });
  }
}
