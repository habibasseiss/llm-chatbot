import { GenericMessage, MessageSource } from "@/domain/entities/GenericMessage";
import { WhatsAppWebhookEvent } from "@/domain/entities/Message";
import { WhatsAppAdapter } from "@/infrastructure/adapters/WhatsAppAdapter";
import axios from "axios";

// Mock axios to prevent actual HTTP requests
jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe("WhatsAppAdapter", () => {
  let whatsAppAdapter: WhatsAppAdapter;
  let mockWebhookEvent: WhatsAppWebhookEvent;
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Create WhatsAppAdapter instance
    whatsAppAdapter = new WhatsAppAdapter("mock-graph-api-token");
    
    // Create mock webhook event
    mockWebhookEvent = {
      messaging_product: "whatsapp",
      metadata: {
        display_phone_number: "15556109711",
        phone_number_id: "284011161465592",
      },
      contacts: [
        {
          profile: {
            name: "Test User",
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
            body: "Hello, bot!",
          },
          type: "text",
        },
      ],
    };
    
    // Mock axios responses
    mockedAxios.post.mockResolvedValue({ data: { success: true } });
  });
  
  describe("convertToGenericMessage", () => {
    it("should convert WhatsApp webhook event to GenericMessage for text messages", () => {
      const result = whatsAppAdapter.convertToGenericMessage(mockWebhookEvent);
      
      expect(result).toEqual({
        id: "wamid.HBgMNTU2NzkyMzI2MjQ2FQIAEhgUM0FERkY1NzhBNkRFRUFFQjFBOUYA",
        userId: "556792326246",
        userName: "Test User",
        content: "Hello, bot!",
        timestamp: "1722539741",
        source: MessageSource.WHATSAPP,
        rawData: mockWebhookEvent,
      });
    });
    
    it("should convert WhatsApp webhook event to GenericMessage for button reply", () => {
      const buttonReplyEvent: WhatsAppWebhookEvent = {
        ...mockWebhookEvent,
        messages: [
          {
            from: "556792326246",
            id: "wamid.button123",
            timestamp: "1722539742",
            type: "interactive",
            interactive: {
              type: "button_reply",
              button_reply: {
                id: "btn_1",
                title: "Yes, please",
              },
              list_reply: undefined as any,
            },
          },
        ],
      };
      
      const result = whatsAppAdapter.convertToGenericMessage(buttonReplyEvent);
      
      expect(result).toEqual({
        id: "wamid.button123",
        userId: "556792326246",
        userName: "Test User",
        content: "Yes, please",
        timestamp: "1722539742",
        source: MessageSource.WHATSAPP,
        rawData: buttonReplyEvent,
      });
    });
    
    it("should convert WhatsApp webhook event to GenericMessage for list reply", () => {
      const listReplyEvent: WhatsAppWebhookEvent = {
        ...mockWebhookEvent,
        messages: [
          {
            from: "556792326246",
            id: "wamid.list123",
            timestamp: "1722539743",
            type: "interactive",
            interactive: {
              type: "list_reply",
              list_reply: {
                id: "list_1",
                title: "Option 1",
              },
              button_reply: undefined as any,
            },
          },
        ],
      };
      
      const result = whatsAppAdapter.convertToGenericMessage(listReplyEvent);
      
      expect(result).toEqual({
        id: "wamid.list123",
        userId: "556792326246",
        userName: "Test User",
        content: "Option 1",
        timestamp: "1722539743",
        source: MessageSource.WHATSAPP,
        rawData: listReplyEvent,
      });
    });
  });
  
  describe("sendResponse", () => {
    it("should mark message as read and send text response", async () => {
      const genericMessage: GenericMessage = {
        id: "wamid.HBgMNTU2NzkyMzI2MjQ2FQIAEhgUM0FERkY1NzhBNkRFRUFFQjFBOUYA",
        userId: "556792326246",
        userName: "Test User",
        content: "Hello, bot!",
        timestamp: "1722539741",
        source: MessageSource.WHATSAPP,
        rawData: mockWebhookEvent,
      };
      
      await whatsAppAdapter.sendResponse(genericMessage, { content: "Hello, human!" });
      
      // Should mark message as read
      expect(mockedAxios.post).toHaveBeenNthCalledWith(
        1,
        "https://graph.facebook.com/v17.0/284011161465592/messages",
        {
          messaging_product: "whatsapp",
          status: "read",
          message_id: "wamid.HBgMNTU2NzkyMzI2MjQ2FQIAEhgUM0FERkY1NzhBNkRFRUFFQjFBOUYA",
        },
        {
          headers: {
            Authorization: "Bearer mock-graph-api-token",
            "Content-Type": "application/json",
          },
        }
      );
      
      // Should send text message
      expect(mockedAxios.post).toHaveBeenNthCalledWith(
        2,
        "https://graph.facebook.com/v17.0/284011161465592/messages",
        {
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: "556792326246",
          type: "text",
          text: {
            preview_url: false,
            body: "Hello, human!",
          },
        },
        {
          headers: {
            Authorization: "Bearer mock-graph-api-token",
            "Content-Type": "application/json",
          },
        }
      );
    });
    
    it("should send interactive message when options are provided", async () => {
      const genericMessage: GenericMessage = {
        id: "wamid.HBgMNTU2NzkyMzI2MjQ2FQIAEhgUM0FERkY1NzhBNkRFRUFFQjFBOUYA",
        userId: "556792326246",
        userName: "Test User",
        content: "Hello, bot!",
        timestamp: "1722539741",
        source: MessageSource.WHATSAPP,
        rawData: mockWebhookEvent,
      };
      
      await whatsAppAdapter.sendResponse(genericMessage, { 
        content: "How can I help you?", 
        options: ["Option 1", "Option 2"] 
      });
      
      // Should mark message as read (first call)
      expect(mockedAxios.post).toHaveBeenNthCalledWith(
        1,
        expect.any(String),
        expect.objectContaining({
          status: "read",
        }),
        expect.any(Object)
      );
      
      // Should send interactive message (second call)
      expect(mockedAxios.post).toHaveBeenNthCalledWith(
        2,
        "https://graph.facebook.com/v17.0/284011161465592/messages",
        {
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: "556792326246",
          type: "interactive",
          interactive: {
            type: "list",
            header: {
              type: "text",
              text: "Options",
            },
            body: {
              text: "How can I help you?",
            },
            action: {
              button: "Select an option",
              sections: [
                {
                  rows: [
                    { id: "option_1", title: "Option 1" },
                    { id: "option_2", title: "Option 2" },
                  ],
                },
              ],
            },
          },
        },
        expect.any(Object)
      );
    });
  });
  
  describe("initialize", () => {
    it("should log initialization message", () => {
      const consoleSpy = jest.spyOn(console, "log");
      whatsAppAdapter.initialize();
      expect(consoleSpy).toHaveBeenCalledWith("WhatsApp adapter initialized");
      consoleSpy.mockRestore();
    });
  });
});
