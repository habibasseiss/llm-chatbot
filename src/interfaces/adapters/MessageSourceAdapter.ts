import {
  GenericMessage,
  GenericResponse,
} from "@/domain/entities/GenericMessage";

// Interface for message source adapters
export interface MessageSourceAdapter<TSourceMessage = unknown> {
  // Convert source-specific message to generic message
  convertToGenericMessage(sourceMessage: TSourceMessage): GenericMessage;

  // Send response back to the source
  sendResponse(
    originalMessage: GenericMessage,
    response: GenericResponse
  ): Promise<void>;

  // Initialize the adapter (set up listeners, etc.)
  initialize(): void;
}
