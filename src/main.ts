import { PostgresDatabaseConnection } from "@/infrastructure/database/DatabaseConnection";
import { DatabasePromptRepository } from "@/infrastructure/repositories/DatabasePromptRepository";
import { ExpressServer } from "@/infrastructure/webserver/ExpressServer";
import { WebhookController } from "@/interfaces/controllers/WebhookController";
import dotenv from "dotenv";
import { MessageSource } from "./domain/entities/GenericMessage";
import { CLIAdapter } from "./infrastructure/adapters/CLIAdapter";
import { WhatsAppAdapter } from "./infrastructure/adapters/WhatsAppAdapter";
import { DatabaseSettingsGateway } from "./infrastructure/gateways/DatabaseSettingsGateway";
import { GroqAIGateway } from "./infrastructure/gateways/GroqAIGateway";
import { OllamaAIGateway } from "./infrastructure/gateways/OllamaAIGateway";
import { OpenAIAIGateway } from "./infrastructure/gateways/OpenAIAIGateway";
import { MessageSourceAdapter } from "./interfaces/adapters/MessageSourceAdapter";
import { ApiController } from "./interfaces/controllers/ApiController";
import { CLIController } from "./interfaces/controllers/CLIController";
import { AIGateway } from "./interfaces/gateways/AIGateway";
import { HandleChatSession } from "./usecases/message/HandleChatSession";
import { HandleGenericMessage } from "./usecases/message/HandleGenericMessage";

dotenv.config();

const PORT = 3000;
const {
  OPENAI_BASE_URL,
  OPENAI_API_KEY,
  GRAPH_API_TOKEN,
  OLLAMA_HOST,
  GROQ_API_KEY,
  DATABASE_URL,
  API_URL,
  API_KEY,
} = process.env;

// Get the enabled message sources from environment variables or default to all
const enabledSources = process.env.ENABLED_SOURCES
  ? process.env.ENABLED_SOURCES.split(",")
  : [MessageSource.WHATSAPP, MessageSource.CLI];

const aiService = process.env.AI_SERVICE;
console.log(`AI service: ${aiService}`);

let aiGateway: AIGateway;

switch (aiService) {
  case "openai":
    aiGateway = new OpenAIAIGateway(OPENAI_BASE_URL, OPENAI_API_KEY!);
    break;
  case "ollama":
    aiGateway = new OllamaAIGateway(OLLAMA_HOST!);
    break;
  case "groq":
    aiGateway = new GroqAIGateway(GROQ_API_KEY!);
    break;
  default:
    throw new Error(`Invalid AI service: ${aiService}`);
}

const pgDatabaseConnection = new PostgresDatabaseConnection(DATABASE_URL!);
const promptRepository = new DatabasePromptRepository(pgDatabaseConnection);
const settingsGateway = new DatabaseSettingsGateway(pgDatabaseConnection);

// Create adapters map
const adapters = new Map<MessageSource, MessageSourceAdapter<any>>();

// Initialize the generic message handler
const handleGenericMessage = new HandleGenericMessage(
  aiGateway,
  promptRepository,
  settingsGateway,
  adapters
);

// Initialize the chat session handler
const handleChatSession = new HandleChatSession(
  aiGateway,
  promptRepository,
  settingsGateway
);

// Initialize controllers and adapters based on enabled sources
if (enabledSources.includes(MessageSource.WHATSAPP)) {
  console.log("Initializing WhatsApp adapter...");
  const whatsAppAdapter = new WhatsAppAdapter(GRAPH_API_TOKEN!);
  adapters.set(MessageSource.WHATSAPP, whatsAppAdapter);

  const webhookController = new WebhookController(
    handleGenericMessage,
    GRAPH_API_TOKEN!
  );
  const apiController = new ApiController(handleChatSession);
  const server = new ExpressServer(webhookController, apiController);

  server.start(PORT);
  console.log(`WhatsApp webhook server started on port ${PORT}`);
}

if (enabledSources.includes(MessageSource.CLI)) {
  console.log("Initializing CLI adapter...");
  const cliAdapter = new CLIAdapter();
  adapters.set(MessageSource.CLI, cliAdapter);

  const cliController = new CLIController(handleGenericMessage);
  cliController.start();
}
