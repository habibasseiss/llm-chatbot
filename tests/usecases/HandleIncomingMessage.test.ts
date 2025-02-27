import { FACEBOOK_GRAPH_API } from "@/constants/api";
import { WhatsAppWebhookEvent } from "@/domain/entities/Message";
import { PromptRepository } from "@/domain/repositories/PromptRepository";
import { AIGateway } from "@/interfaces/gateways/AIGateway";
import { APIGateway, GeneralSettings } from "@/interfaces/gateways/APIGateway";

import { HandleIncomingMessage } from "@/usecases/message/HandleIncomingMessage";
import axios from "axios";
import { MockPromptRepository } from "tests/repositories/MockPromptRepository";

// Mock axios to prevent actual HTTP requests
jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

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

class MockAPIGateway implements APIGateway {
  async getSettings(): Promise<GeneralSettings> {
    return {
      system_prompt: "system prompt",
      session_duration: 24,
      llm_model: "model-id",
    };
  }
}

describe("HandleIncomingMessage", () => {
  let handleIncomingMessage: HandleIncomingMessage;
  let aiGateway: AIGateway;
  let promptRepository: PromptRepository;
  let webhookEvent: WhatsAppWebhookEvent;
  let apiGateway: MockAPIGateway;

  beforeEach(() => {
    aiGateway = mockAIGateway;
    apiGateway = new MockAPIGateway();
    promptRepository = new MockPromptRepository();
    handleIncomingMessage = new HandleIncomingMessage(
      "mock-graph-api-token",
      aiGateway,
      promptRepository,
      apiGateway
    );
    webhookEvent = {
      messaging_product: "whatsapp",
      metadata: {
        display_phone_number: "15556109711",
        phone_number_id: "284011161465592",
      },
      contacts: [
        {
          profile: {
            name: "Habib",
          },
          wa_id: "556792326246",
        },
      ],
      messages: [
        {
          from: "556792326246",
          id: "wamid.HBgMNTU2NzkyMzI2MjQ2FQIAEhgUM0FERkY1NzhBNkRFRUFFQjFBOUYA",
          timestamp: "1722539741",
          text: {
            body: "oi com o samuel",
          },
          type: "text",
        },
      ],
    };
  });

  it("should store prompt", async () => {
    await handleIncomingMessage.execute(webhookEvent);

    const sessionId = await promptRepository.getSessionId(
      "556792326246",
      "Habib"
    );
    const chatHistory = await promptRepository.getPromptHistory(sessionId);
    expect(chatHistory.messages.length).toBe(3); // system prompt, user message, AI response
  });

  it("should mark the message as read and send a reply", async () => {
    await handleIncomingMessage.execute(webhookEvent);

    expect(mockedAxios).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        method: "POST",
        url: FACEBOOK_GRAPH_API.ENDPOINTS.MESSAGES(
          webhookEvent.metadata.phone_number_id
        ),
        data: {
          messaging_product: "whatsapp",
          status: "read",
          message_id:
            "wamid.HBgMNTU2NzkyMzI2MjQ2FQIAEhgUM0FERkY1NzhBNkRFRUFFQjFBOUYA",
        },
        headers: { Authorization: `Bearer mock-graph-api-token` },
      })
    );

    expect(mockedAxios).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        method: "POST",
        url: FACEBOOK_GRAPH_API.ENDPOINTS.MESSAGES(
          webhookEvent.metadata.phone_number_id
        ),
        data: {
          messaging_product: "whatsapp",
          to: "556792326246",
          type: "text",
          text: { body: "AI response" },
        },
        headers: { Authorization: `Bearer mock-graph-api-token` },
      })
    );
  });
});
