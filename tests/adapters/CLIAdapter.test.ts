import { GenericMessage, MessageSource } from "@/domain/entities/GenericMessage";
import { CLIAdapter } from "@/infrastructure/adapters/CLIAdapter";
import readline from "readline";

// Mock readline
jest.mock("readline", () => ({
  createInterface: jest.fn().mockReturnValue({
    on: jest.fn(),
    close: jest.fn(),
  }),
}));

// Mock uuid
jest.mock("uuid", () => ({
  v4: jest.fn().mockReturnValue("mock-uuid"),
}));

// Mock console.log
const originalConsoleLog = console.log;
let consoleOutput: string[] = [];
console.log = jest.fn((...args) => {
  consoleOutput.push(args.join(" "));
  return undefined;
});

describe("CLIAdapter", () => {
  let cliAdapter: CLIAdapter;
  let mockRl: any;
  let mockLineHandler: any;

  beforeEach(() => {
    // Clear console output
    consoleOutput = [];
    
    // Reset mocks
    jest.clearAllMocks();
    
    // Setup mock readline interface
    mockLineHandler = jest.fn();
    mockRl = {
      on: jest.fn((event, callback) => {
        if (event === "line") {
          mockLineHandler = callback;
        }
      }),
      close: jest.fn(),
    };
    (readline.createInterface as jest.Mock).mockReturnValue(mockRl);
    
    // Create CLIAdapter instance
    cliAdapter = new CLIAdapter();
  });

  afterAll(() => {
    // Restore console.log
    console.log = originalConsoleLog;
  });

  describe("initialize", () => {
    it("should set up readline interface and start listening", () => {
      cliAdapter.initialize();
      
      expect(readline.createInterface).toHaveBeenCalledWith({
        input: process.stdin,
        output: process.stdout,
      });
      expect(mockRl.on).toHaveBeenCalledWith("line", expect.any(Function));
      expect(consoleOutput[0]).toBe("CLI Chatbot initialized. Type 'exit' to quit.");
    });
  });

  describe("convertToGenericMessage", () => {
    it("should convert CLI input to a GenericMessage", () => {
      const result = cliAdapter.convertToGenericMessage("Hello, bot!");
      
      expect(result).toEqual({
        id: "mock-uuid",
        userId: "cli-user",
        userName: "CLI User",
        content: "Hello, bot!",
        timestamp: expect.any(String),
        source: MessageSource.CLI,
        rawData: { input: "Hello, bot!" },
      });
    });
  });

  describe("sendResponse", () => {
    it("should log the response to console", async () => {
      const message: GenericMessage = {
        id: "test-id",
        userId: "cli-user",
        userName: "Test User",
        content: "Hello",
        timestamp: new Date().toISOString(),
        source: MessageSource.CLI,
      };
      
      await cliAdapter.sendResponse(message, { content: "Hello, human!" });
      
      expect(consoleOutput[0]).toBe("\n🤖 Bot: Hello, human!");
    });

    it("should display options if provided", async () => {
      const message: GenericMessage = {
        id: "test-id",
        userId: "cli-user",
        userName: "Test User",
        content: "Help",
        timestamp: new Date().toISOString(),
        source: MessageSource.CLI,
      };
      
      await cliAdapter.sendResponse(message, { 
        content: "How can I help you?", 
        options: ["Option 1", "Option 2"] 
      });
      
      expect(consoleOutput[0]).toBe("\n🤖 Bot: How can I help you?");
      expect(consoleOutput[1]).toBe("\nOptions:");
      expect(consoleOutput[2]).toBe("1. Option 1");
      expect(consoleOutput[3]).toBe("2. Option 2");
      expect(consoleOutput[4]).toBe("");
    });
  });

  describe("message handling", () => {
    it("should call the message handler when input is received", async () => {
      const mockHandler = jest.fn();
      cliAdapter.setMessageHandler(mockHandler);
      cliAdapter.initialize();
      
      // Simulate user input
      await mockLineHandler("Hello, bot!");
      
      expect(mockHandler).toHaveBeenCalledWith(expect.objectContaining({
        content: "Hello, bot!",
        source: MessageSource.CLI,
      }));
    });

    it("should exit when 'exit' is typed", async () => {
      const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => undefined as never);
      cliAdapter.initialize();
      
      // Simulate 'exit' input
      await mockLineHandler("exit");
      
      expect(mockRl.close).toHaveBeenCalled();
      expect(mockExit).toHaveBeenCalledWith(0);
      expect(consoleOutput[1]).toBe("Goodbye!");
      
      mockExit.mockRestore();
    });
  });
});
