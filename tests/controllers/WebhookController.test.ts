import { MessageSource } from "@/domain/entities/GenericMessage";
import { MessageSourceAdapter } from "@/interfaces/adapters/MessageSourceAdapter";
import { WebhookController } from "@/interfaces/controllers/WebhookController";
import { AIGateway } from "@/interfaces/gateways/AIGateway";
import { HandleGenericMessage } from "@/usecases/message/HandleGenericMessage";
import express from "express";
import request from "supertest";

describe("WebhookController", () => {
  let app: express.Application;
  let controller: WebhookController;
  let mockHandleGenericMessage: HandleGenericMessage;

  beforeEach(() => {
    console.log = jest.fn();
    app = express();

    const mockAIGateway: AIGateway = {
      getAIResponse: jest.fn().mockResolvedValue(
        JSON.stringify({
          bot: "AI response",
          options: [],
          closed: false,
        })
      ),
      getAISummary: jest.fn(),
    };

    // Create mock adapters map
    const adaptersMap = new Map<MessageSource, MessageSourceAdapter<any>>();

    mockHandleGenericMessage = new HandleGenericMessage(
      mockAIGateway,
      {
        getSessionId: jest.fn().mockResolvedValue("test-session-id"),
        getPromptHistory: jest.fn().mockResolvedValue({ messages: [] }),
        savePrompt: jest.fn(),
        closeSession: jest.fn(),
      },
      {
        getSettings: jest.fn().mockResolvedValue({
          system_prompt: "mock prompt",
          session_duration: 24,
          llm_config: {
            model: "mock-model",
            temperature: 0.7,
            top_p: 1,
            max_tokens: 1024,
          },
        }),
        getSetting: jest.fn(),
        updateSetting: jest.fn(),
      },
      adaptersMap
    );

    controller = new WebhookController(
      mockHandleGenericMessage,
      "mock-graph-api-token"
    );
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
