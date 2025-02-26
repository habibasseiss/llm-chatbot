// Generic message interface that can be used across different platforms
export interface GenericMessage {
  id: string;
  userId: string;
  userName?: string; // Explicitly optional
  content: string;
  timestamp: string;
  source: MessageSource;
  rawData?: any; // Original data from the source
}

// Supported message sources
export enum MessageSource {
  WHATSAPP = 'whatsapp',
  CLI = 'cli',
  // Add more sources as needed
}

// Generic response interface
export interface GenericResponse {
  content: string;
  options?: string[];
  isFinalResponse?: boolean;
}
