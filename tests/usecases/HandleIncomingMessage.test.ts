import axios from "axios";
import { Message, Metadata } from "../../src/domain/entities/Message";
import { ChatHistory, Prompt } from "../../src/domain/entities/Prompt";
import { AIGateway } from "../../src/interfaces/gateways/AIGateway";
import { PromptRepository } from "../../src/interfaces/repositories/PromptRepository";
import { HandleIncomingMessage } from "../../src/usecases/HandleIncomingMessage";

// Mock axios to prevent actual HTTP requests
jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

class MockAIGateway implements AIGateway {
  async getAIResponse(chatHistory: ChatHistory): Promise<string> {
    return `AI response to: ${chatHistory.messages[0].content}`;
  }
}

export class MockPromptRepository implements PromptRepository {
  private prompts: { [key: string]: Prompt[] } = {};

  async getPromptHistory(userId: string): Promise<ChatHistory> {
    return { messages: this.prompts[userId] || [] };
  }

  async savePrompt(prompt: Prompt): Promise<void> {
    if (!prompt.id) return;
    if (!this.prompts[prompt.id]) {
      this.prompts[prompt.id] = [];
    }
    this.prompts[prompt.id].push(prompt);
  }
}

describe("HandleIncomingMessage", () => {
  let handleIncomingMessage: HandleIncomingMessage;
  let aiGateway: AIGateway;
  let promptRepository: PromptRepository;

  beforeEach(() => {
    aiGateway = new MockAIGateway();
    promptRepository = new MockPromptRepository();
    handleIncomingMessage = new HandleIncomingMessage(
      "mock-graph-api-token",
      aiGateway,
      promptRepository,
    );
  });

  it("should send a reply with AI response", async () => {
    const message: Message = {
      type: "text",
      from: "12345",
      text: { body: "Hello" },
      id: "msgid",
    };
    const metadata: Metadata = {
      phone_number_id: "phone-number-id",
    };

    await handleIncomingMessage.execute(message, metadata);

    expect(mockedAxios).toHaveBeenCalledWith(
      expect.objectContaining({
        url:
          `https://graph.facebook.com/v18.0/${metadata.phone_number_id}/messages`,
        data: {
          messaging_product: "whatsapp",
          to: "12345",
          text: { body: "AI response to: Hello" },
          context: { message_id: "msgid" },
        },
        headers: { Authorization: `Bearer mock-graph-api-token` },
      }),
    );
  });

  it("should mark the message as read", async () => {
    const message: Message = {
      type: "text",
      from: "12345",
      text: { body: "Hello" },
      id: "msgid",
    };
    const metadata: Metadata = {
      phone_number_id: "phone-number-id",
    };

    await handleIncomingMessage.execute(message, metadata);

    expect(mockedAxios).toHaveBeenCalledWith(
      expect.objectContaining({
        url:
          `https://graph.facebook.com/v18.0/${metadata.phone_number_id}/messages`,
        data: {
          messaging_product: "whatsapp",
          status: "read",
          message_id: "msgid",
        },
        headers: { Authorization: `Bearer mock-graph-api-token` },
      }),
    );
  });
});
