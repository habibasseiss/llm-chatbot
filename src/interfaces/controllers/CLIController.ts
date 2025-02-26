import { CLIAdapter } from "@/infrastructure/adapters/CLIAdapter";
import { HandleGenericMessage } from "@/usecases/message/HandleGenericMessage";

export class CLIController {
  private cliAdapter: CLIAdapter;

  constructor(private handleGenericMessage: HandleGenericMessage) {
    this.cliAdapter = new CLIAdapter();
    this.setupAdapter();
  }

  private setupAdapter(): void {
    this.cliAdapter.setMessageHandler(async (message) => {
      await this.handleGenericMessage.execute(message);
    });
  }

  start(): void {
    this.cliAdapter.initialize();
  }
}
