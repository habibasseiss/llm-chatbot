import { GenericMessage, MessageSource } from "@/domain/entities/GenericMessage";
import { WhatsAppWebhookEvent } from "@/domain/entities/Message";
import { MessageSourceAdapter } from "@/interfaces/adapters/MessageSourceAdapter";
import { CLIAdapter } from "@/infrastructure/adapters/CLIAdapter";
import { WhatsAppAdapter } from "@/infrastructure/adapters/WhatsAppAdapter";

// Mock dependencies
jest.mock("readline", () => ({
  createInterface: jest.fn().mockReturnValue({
    on: jest.fn(),
    close: jest.fn(),
  }),
}));

jest.mock("axios");

describe("MessageSourceAdapter Interface", () => {
  let cliAdapter: MessageSourceAdapter<string>;
  let whatsAppAdapter: MessageSourceAdapter<WhatsAppWebhookEvent>;

  beforeEach(() => {
    cliAdapter = new CLIAdapter();
    whatsAppAdapter = new WhatsAppAdapter("mock-token");
  });

  it("should ensure CLIAdapter implements MessageSourceAdapter", () => {
    // Verify that CLIAdapter has all required methods
    expect(typeof cliAdapter.convertToGenericMessage).toBe("function");
    expect(typeof cliAdapter.sendResponse).toBe("function");
    expect(typeof cliAdapter.initialize).toBe("function");
  });

  it("should ensure WhatsAppAdapter implements MessageSourceAdapter", () => {
    // Verify that WhatsAppAdapter has all required methods
    expect(typeof whatsAppAdapter.convertToGenericMessage).toBe("function");
    expect(typeof whatsAppAdapter.sendResponse).toBe("function");
    expect(typeof whatsAppAdapter.initialize).toBe("function");
  });

  it("should convert CLI message to GenericMessage with correct source", () => {
    const cliMessage = "Hello from CLI";
    const genericMessage = cliAdapter.convertToGenericMessage(cliMessage);
    
    expect(genericMessage.content).toBe(cliMessage);
    expect(genericMessage.source).toBe(MessageSource.CLI);
  });

  it("should convert WhatsApp message to GenericMessage with correct source", () => {
    const whatsAppMessage: WhatsAppWebhookEvent = {
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
          id: "wamid.test123",
          timestamp: "1722539741",
          text: {
            body: "Hello from WhatsApp",
          },
          type: "text",
        },
      ],
    };
    
    const genericMessage = whatsAppAdapter.convertToGenericMessage(whatsAppMessage);
    
    expect(genericMessage.content).toBe("Hello from WhatsApp");
    expect(genericMessage.source).toBe(MessageSource.WHATSAPP);
  });
});
