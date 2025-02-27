import {
  GenericMessage,
  MessageSource,
} from "@/domain/entities/GenericMessage";
import { PromptRepository } from "@/domain/repositories/PromptRepository";
import { MessageSourceAdapter } from "@/interfaces/adapters/MessageSourceAdapter";
import { AIGateway } from "@/interfaces/gateways/AIGateway";
import { APIGateway, GeneralSettings } from "@/interfaces/gateways/APIGateway";
import { HandleGenericMessage } from "@/usecases/message/HandleGenericMessage";
import { MockPromptRepository } from "tests/repositories/MockPromptRepository";

describe("HandleGenericMessage", () => {
  let handleGenericMessage: HandleGenericMessage;
  let mockAIGateway: AIGateway;
  let mockPromptRepository: PromptRepository;
  let mockAPIGateway: APIGateway;
  let mockCLIAdapter: MessageSourceAdapter<string>;
  let mockWhatsAppAdapter: MessageSourceAdapter<any>;
  let adaptersMap: Map<MessageSource, MessageSourceAdapter<any>>;

  beforeEach(() => {
    // Mock AI Gateway
    mockAIGateway = {
      getAIResponse: jest.fn().mockResolvedValue(
        JSON.stringify({
          bot: "AI response",
          options: [],
          closed: false,
        })
      ),
      getAISummary: jest.fn().mockResolvedValue(
        JSON.stringify({
          summary: "Chat summary",
        })
      ),
    };

    // Mock API Gateway
    mockAPIGateway = {
      getSettings: jest.fn().mockResolvedValue({
        system_prompt: "system prompt",
        session_duration: 24,
        llm_model: "model-id",
      } as GeneralSettings),
    };

    // Mock Prompt Repository
    mockPromptRepository = new MockPromptRepository();

    // Mock CLI Adapter
    mockCLIAdapter = {
      convertToGenericMessage: jest.fn(),
      sendResponse: jest.fn().mockResolvedValue(undefined),
      initialize: jest.fn(),
    };

    // Mock WhatsApp Adapter
    mockWhatsAppAdapter = {
      convertToGenericMessage: jest.fn(),
      sendResponse: jest.fn().mockResolvedValue(undefined),
      initialize: jest.fn(),
    };

    // Create adapters map
    adaptersMap = new Map<MessageSource, MessageSourceAdapter<any>>();
    adaptersMap.set(MessageSource.CLI, mockCLIAdapter);
    adaptersMap.set(MessageSource.WHATSAPP, mockWhatsAppAdapter);

    // Create HandleGenericMessage instance
    handleGenericMessage = new HandleGenericMessage(
      mockAIGateway,
      mockPromptRepository,
      mockAPIGateway,
      adaptersMap
    );
  });

  it("should process CLI message and send response", async () => {
    // Create a CLI message
    const cliMessage: GenericMessage = {
      id: "cli-msg-1",
      userId: "cli-user",
      userName: "CLI User",
      content: "Hello from CLI",
      timestamp: new Date().toISOString(),
      source: MessageSource.CLI,
    };

    // Execute the usecase
    await handleGenericMessage.execute(cliMessage);

    // Verify API Gateway was called to get settings
    expect(mockAPIGateway.getSettings).toHaveBeenCalled();

    // Verify session was created and prompts were saved
    const sessionId = await mockPromptRepository.getSessionId(
      "cli-user",
      "CLI User"
    );
    const chatHistory = await mockPromptRepository.getPromptHistory(sessionId);

    // Should have 3 messages: system prompt, user message, AI response
    expect(chatHistory.messages.length).toBe(3);
    expect(chatHistory.messages[0].role).toBe("system");
    expect(chatHistory.messages[1].role).toBe("user");
    expect(chatHistory.messages[1].content).toBe("Hello from CLI");
    expect(chatHistory.messages[2].role).toBe("assistant");

    // Verify AI Gateway was called to get response
    expect(mockAIGateway.getAIResponse).toHaveBeenCalled();

    // Verify CLI adapter was used to send response
    expect(mockCLIAdapter.sendResponse).toHaveBeenCalledWith(
      cliMessage,
      expect.objectContaining({
        content: expect.any(String),
      })
    );
  });

  it("should process WhatsApp message and send response", async () => {
    // Create a WhatsApp message
    const whatsAppMessage: GenericMessage = {
      id: "wa-msg-1",
      userId: "wa-user",
      userName: "WhatsApp User",
      content: "Hello from WhatsApp",
      timestamp: new Date().toISOString(),
      source: MessageSource.WHATSAPP,
      rawData: {
        /* mock webhook event */
      },
    };

    // Execute the usecase
    await handleGenericMessage.execute(whatsAppMessage);

    // Verify API Gateway was called to get settings
    expect(mockAPIGateway.getSettings).toHaveBeenCalled();

    // Verify session was created and prompts were saved
    const sessionId = await mockPromptRepository.getSessionId(
      "wa-user",
      "WhatsApp User"
    );
    const chatHistory = await mockPromptRepository.getPromptHistory(sessionId);

    // Should have 3 messages: system prompt, user message, AI response
    expect(chatHistory.messages.length).toBe(3);
    expect(chatHistory.messages[0].role).toBe("system");
    expect(chatHistory.messages[1].role).toBe("user");
    expect(chatHistory.messages[1].content).toBe("Hello from WhatsApp");
    expect(chatHistory.messages[2].role).toBe("assistant");

    // Verify AI Gateway was called to get response
    expect(mockAIGateway.getAIResponse).toHaveBeenCalled();

    // Verify WhatsApp adapter was used to send response
    expect(mockWhatsAppAdapter.sendResponse).toHaveBeenCalledWith(
      whatsAppMessage,
      expect.objectContaining({
        content: expect.any(String),
      })
    );
  });

  it("should handle message with options in response", async () => {
    // Mock AI response with options
    (mockAIGateway.getAIResponse as jest.Mock).mockResolvedValueOnce(
      JSON.stringify({
        bot: "Choose an option",
        options: ["Option 1", "Option 2"],
        closed: false,
      })
    );

    // Create a message
    const message: GenericMessage = {
      id: "msg-with-options",
      userId: "test-user",
      userName: "Test User",
      content: "Show me options",
      timestamp: new Date().toISOString(),
      source: MessageSource.CLI,
    };

    // Execute the usecase
    await handleGenericMessage.execute(message);

    // Verify adapter was called with options
    expect(mockCLIAdapter.sendResponse).toHaveBeenCalledWith(
      message,
      expect.objectContaining({
        content: "Choose an option",
        options: ["Option 1", "Option 2"],
      })
    );
  });

  it("should close session when response is final", async () => {
    // Mock AI response with closed=true
    (mockAIGateway.getAIResponse as jest.Mock).mockResolvedValueOnce(
      JSON.stringify({
        bot: "Final response",
        options: [],
        closed: true,
      })
    );

    // Create a message
    const message: GenericMessage = {
      id: "final-msg",
      userId: "test-user",
      userName: "Test User",
      content: "Goodbye",
      timestamp: new Date().toISOString(),
      source: MessageSource.CLI,
    };

    // Spy on closeSession method
    const closeSessionSpy = jest.spyOn(mockPromptRepository, "closeSession");

    // Execute the usecase
    await handleGenericMessage.execute(message);

    // Verify AI Gateway was called to get summary
    expect(mockAIGateway.getAISummary).toHaveBeenCalled();

    // Verify session was closed with any sessionId and summary
    expect(closeSessionSpy).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(String)
    );
  });

  it("should handle missing adapter gracefully", async () => {
    // Create a message with unsupported source
    const message: GenericMessage = {
      id: "unsupported-msg",
      userId: "test-user",
      userName: "Test User",
      content: "Hello",
      timestamp: new Date().toISOString(),
      source: "unsupported" as MessageSource,
    };

    // Mock console.error
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();

    // Execute the usecase
    await handleGenericMessage.execute(message);

    // Verify error was logged
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining("No adapter found for source")
    );

    consoleErrorSpy.mockRestore();
  });

  it("should use fallback username if not provided", async () => {
    // Create a message without userName
    const message: GenericMessage = {
      id: "no-username-msg",
      userId: "test-user",
      content: "Hello",
      timestamp: new Date().toISOString(),
      source: MessageSource.CLI,
    };

    // Execute the usecase
    await handleGenericMessage.execute(message);

    // Verify session was created with fallback username
    const sessionId = await mockPromptRepository.getSessionId(
      "test-user",
      "User-test-user"
    );
    expect(sessionId).toBeTruthy();
  });
});
