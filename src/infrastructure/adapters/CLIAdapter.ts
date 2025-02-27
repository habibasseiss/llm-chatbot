import {
  GenericMessage,
  GenericResponse,
  MessageSource,
} from "@/domain/entities/GenericMessage";
import { MessageSourceAdapter } from "@/interfaces/adapters/MessageSourceAdapter";

import readline from "readline";
import { v4 as uuidv4 } from "uuid";

export class CLIAdapter implements MessageSourceAdapter<string> {
  private rl: readline.Interface;
  private messageHandler: (message: GenericMessage) => Promise<void> =
    async () => {};
  private userName: string = "CLI User";

  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
  }

  convertToGenericMessage(cliInput: string): GenericMessage {
    return {
      id: uuidv4(),
      userId: "cli-user",
      userName: this.userName,
      content: cliInput,
      timestamp: new Date().toISOString(),
      source: MessageSource.CLI,
      rawData: { input: cliInput },
    };
  }

  async sendResponse(
    originalMessage: GenericMessage,
    response: GenericResponse
  ): Promise<void> {
    console.log("\n🤖 Bot: " + response.content);

    if (response.options && response.options.length > 0) {
      console.log("\nOptions:");
      response.options.forEach((option, index) => {
        console.log(`${index + 1}. ${option}`);
      });
      console.log("");
    }
  }

  initialize(): void {
    console.log("CLI Chatbot initialized. Type 'exit' to quit.");
    this.startListening();
  }

  private startListening(): void {
    this.rl.on("line", async (input) => {
      if (input.toLowerCase() === "exit") {
        console.log("Goodbye!");
        this.rl.close();
        process.exit(0);
        return;
      }

      const message = this.convertToGenericMessage(input);

      if (this.messageHandler) {
        await this.messageHandler(message);
      }
    });
  }

  setMessageHandler(handler: (message: GenericMessage) => Promise<void>): void {
    this.messageHandler = handler;
  }
}
