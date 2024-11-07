import axios from "axios";
import { WhatsAppWebhookEvent } from "../../src/domain/entities/Message";
import { ChatHistory } from "../../src/domain/entities/Prompt";
import { PromptRepository } from "../../src/domain/repositories/PromptRepository";
import { AIGateway } from "../../src/interfaces/gateways/AIGateway";
import {
  APIGateway,
  GeneralSettings,
} from "../../src/interfaces/gateways/APIGateway";
import { HandleIncomingMessage } from "../../src/usecases/message/HandleIncomingMessage";
import { MockPromptRepository } from "../repositories/MockPromptRepository";

// Mock axios to prevent actual HTTP requests
jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

class MockAIGateway implements AIGateway {
  async getAIResponse(
    chatHistory: ChatHistory,
    llmModel?: string,
  ): Promise<string> {
    return `AI response`;
  }
  async getFinalAIResponse(
    prompt: string,
    llmModel?: string,
  ): Promise<string> {
    return `AI response`;
  }
  isFinalResponse(response: string): boolean {
    return response.includes("[closed]");
  }
  parseResponse(response: string): string {
    return response;
  }
}

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
    aiGateway = new MockAIGateway();
    apiGateway = new MockAPIGateway();
    promptRepository = new MockPromptRepository();
    handleIncomingMessage = new HandleIncomingMessage(
      "mock-graph-api-token",
      aiGateway,
      promptRepository,
      apiGateway,
    );
    webhookEvent = {
      "messaging_product": "whatsapp",
      "metadata": {
        "display_phone_number": "15556109711",
        "phone_number_id": "284011161465592",
      },
      "contacts": [
        {
          "profile": {
            "name": "Habib",
          },
          "wa_id": "556792326246",
        },
      ],
      "messages": [
        {
          "from": "556792326246",
          "id":
            "wamid.HBgMNTU2NzkyMzI2MjQ2FQIAEhgUM0FERkY1NzhBNkRFRUFFQjFBOUYA",
          "timestamp": "1722539741",
          "text": {
            "body": "oi com o samuel",
          },
          "type": "text",
        },
      ],
    };
  });

  it("should store prompt", async () => {
    await handleIncomingMessage.execute(webhookEvent);

    const sessionId = await promptRepository.getSessionId(
      "556792326246",
      "Habib",
    );
    const chatHistory = await promptRepository.getPromptHistory(sessionId);
    expect(chatHistory.messages.length).toBe(3); // system prompt, user message, AI response
  });

  it("should send a reply with AI response", async () => {
    await handleIncomingMessage.execute(webhookEvent);

    expect(mockedAxios).toHaveBeenCalledWith(
      expect.objectContaining({
        url:
          `https://graph.facebook.com/v18.0/${webhookEvent.metadata.phone_number_id}/messages`,
        data: {
          messaging_product: "whatsapp",
          to: "556792326246",
          text: { body: "AI response" },
        },
        headers: { Authorization: `Bearer mock-graph-api-token` },
      }),
    );
  });

  it("should mark the message as read", async () => {
    await handleIncomingMessage.execute(webhookEvent);

    expect(mockedAxios).toHaveBeenCalledWith(
      expect.objectContaining({
        url:
          `https://graph.facebook.com/v18.0/${webhookEvent.metadata.phone_number_id}/messages`,
        data: {
          messaging_product: "whatsapp",
          status: "read",
          message_id:
            "wamid.HBgMNTU2NzkyMzI2MjQ2FQIAEhgUM0FERkY1NzhBNkRFRUFFQjFBOUYA",
        },
        headers: { Authorization: `Bearer mock-graph-api-token` },
      }),
    );
  });
});
