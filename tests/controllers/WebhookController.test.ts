import express from "express";
import request from "supertest";
import { WebhookController } from "../../src/interfaces/controllers/WebhookController";
import { HandleIncomingMessage } from "../../src/usecases/message/HandleIncomingMessage";

class MockHandleIncomingMessage extends HandleIncomingMessage {
  async execute() {
    return;
  }
}

describe("WebhookController", () => {
  let app: express.Application;
  let controller: WebhookController;

  beforeEach(() => {
    console.log = jest.fn();
    const mockHandleIncomingMessage = new MockHandleIncomingMessage(
      "mock-graph-api-token",
      {
        getAIResponse: jest.fn(),
        isFinalResponse: jest.fn(),
        parseResponse: jest.fn(),
      },
      {
        getSessionId: jest.fn(),
        getPromptHistory: jest.fn(),
        savePrompt: jest.fn(),
        closeSession: jest.fn(),
      },
      { getSettings: jest.fn() },
    );

    controller = new WebhookController(mockHandleIncomingMessage);

    app = express();
    app.use(express.json());
    app.post("/webhook", (req, res) => controller.handleWebhook(req, res));
    app.get("/webhook", (req, res) => controller.verifyWebhook(req, res));
  });

  it("should return 200 for valid webhook verification", async () => {
    const response = await request(app)
      .get("/webhook")
      .query({
        "hub.mode": "subscribe",
        "hub.verify_token": process.env.WEBHOOK_VERIFY_TOKEN,
        "hub.challenge": "challenge",
      });

    expect(response.status).toBe(200);
    expect(response.text).toBe("challenge");
  });

  it("should return 403 for invalid webhook verification", async () => {
    const response = await request(app)
      .get("/webhook")
      .query({
        "hub.mode": "subscribe",
        "hub.verify_token": "wrong_token",
        "hub.challenge": "challenge",
      });

    expect(response.status).toBe(403);
  });
});
