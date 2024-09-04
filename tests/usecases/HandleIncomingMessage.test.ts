import axios from "axios";
import { Message, Metadata } from "../../src/domain/entities/Message";
import { AIGateway } from "../../src/interfaces/gateways/AIGateway";
import { HandleIncomingMessage } from "../../src/usecases/HandleIncomingMessage";

// Mock axios to prevent actual HTTP requests
jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

class MockAIGateway implements AIGateway {
  async getAIResponse(message: string): Promise<string> {
    return `AI response to: ${message}`;
  }
}

describe("HandleIncomingMessage", () => {
  let handleIncomingMessage: HandleIncomingMessage;
  let aiGateway: AIGateway;

  beforeEach(() => {
    aiGateway = new MockAIGateway();
    handleIncomingMessage = new HandleIncomingMessage(
      "mock-graph-api-token",
      aiGateway,
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
