import { HandleChatSession } from "@/usecases/message/HandleChatSession";
import { Request, Response } from "express";

export class ApiController {
  constructor(private handleSession: HandleChatSession) {}

  async handleGenerateSummary(req: Request, res: Response) {
    const apiToken = req.headers["x-api-token"];
    if (!apiToken || apiToken !== process.env.WEBHOOK_VERIFY_TOKEN) {
      return res.status(400).json({
        error: "X-Api-Token header is missing or invalid",
      });
    }

    const sessionId = req.params.sessionId;
    try {
      const summary = await this.handleSession.execute(sessionId);

      res.status(200).json(JSON.parse(summary));
    } catch (error) {
      console.error("Error generating summary:", error);
      res.status(500).json({ error: "Failed to generate summary" });
    }
  }
}
