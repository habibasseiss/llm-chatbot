import express from "express";
import request from "supertest";
import { WebhookController } from "../../src/interfaces/controllers/WebhookController";
import { HandleIncomingMessage } from "../../src/usecases/message/HandleIncomingMessage";

describe("WebhookController", () => {
  let app: express.Application;
  let controller: WebhookController;
  let mockHandleIncomingMessage: HandleIncomingMessage;

  beforeEach(() => {
    console.log = jest.fn();
    app = express();

    mockHandleIncomingMessage = new HandleIncomingMessage(
      "mock-token",
      {
        getAIResponse: jest.fn(),
        getAISummary: jest.fn(),
        parseResponse: jest
          .fn()
          .mockReturnValue(["response", false, { options: [] }]),
      },
      {
        getSessionId: jest.fn().mockResolvedValue("test-session-id"),
        getPromptHistory: jest.fn().mockResolvedValue([]),
        savePrompt: jest.fn(),
        closeSession: jest.fn(),
      },
      {
        getSettings: jest.fn().mockResolvedValue({
          system_prompt: "mock prompt",
          session_duration: 24,
          llm_model: "mock-model",
        }),
      }
    );

    controller = new WebhookController(mockHandleIncomingMessage);
    app.use(express.json());
    app.post("/webhook", controller.handleWebhook.bind(controller));
    app.get("/webhook", controller.verifyWebhook.bind(controller));
  });

  it("should verify webhook with valid token", async () => {
    const verifyToken = process.env.WEBHOOK_VERIFY_TOKEN || "default-token";
    const response = await request(app).get("/webhook").query({
      "hub.mode": "subscribe",
      "hub.verify_token": verifyToken,
      "hub.challenge": "challenge-token",
    });

    expect(response.status).toBe(200);
    expect(response.text).toBe("challenge-token");
  });

  it("should reject webhook verification with invalid token", async () => {
    const response = await request(app).get("/webhook").query({
      "hub.mode": "subscribe",
      "hub.verify_token": "invalid-token",
      "hub.challenge": "challenge-token",
    });

    expect(response.status).toBe(403);
  });

  it("should handle incoming webhook POST request", async () => {
    const response = await request(app)
      .post("/webhook")
      .send({
        object: "whatsapp_business_account",
        entry: [
          {
            changes: [
              {
                value: {
                  messages: [
                    {
                      from: "test-user",
                      text: { body: "test message" },
                    },
                  ],
                },
              },
            ],
          },
        ],
      });

    expect(response.status).toBe(200);
  });
});
