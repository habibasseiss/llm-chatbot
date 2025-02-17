import { PostgresDatabaseConnection } from "@/infrastructure/database/DatabaseConnection";
import { HttpAPIGateway } from "@/infrastructure/gateways/HttpAPIGateway";
import { DatabasePromptRepository } from "@/infrastructure/repositories/DatabasePromptRepository";
import { ExpressServer } from "@/infrastructure/webserver/ExpressServer";
import { WebhookController } from "@/interfaces/controllers/WebhookController";
import { HandleIncomingMessage } from "@/usecases/message/HandleIncomingMessage";
import dotenv from "dotenv";
import { GroqAIGateway } from "./infrastructure/gateways/GroqAIGateway";
import { OllamaAIGateway } from "./infrastructure/gateways/OllamaAIGateway";
import { ApiController } from "./interfaces/controllers/ApiController";
import { AIGateway } from "./interfaces/gateways/AIGateway";
import { HandleChatSession } from "./usecases/message/HandleChatSession";

dotenv.config();

const PORT = 3000;
const {
  GRAPH_API_TOKEN,
  OLLAMA_HOST,
  GROQ_API_KEY,
  DATABASE_URL,
  API_URL,
  API_KEY,
} = process.env;

const aiService = process.env.AI_SERVICE;
console.log(`AI service: ${aiService}`);

let aiGateway: AIGateway;

switch (aiService) {
  case "ollama":
    aiGateway = new OllamaAIGateway(OLLAMA_HOST!);
    break;
  case "groq":
    aiGateway = new GroqAIGateway(GROQ_API_KEY!);
    break;
  default:
    throw new Error(`Invalid AI service: ${aiService}`);
}

const apiGateway = new HttpAPIGateway(API_URL!, API_KEY!);
const pgDatabaseConnection = new PostgresDatabaseConnection(DATABASE_URL!);
const promptRepository = new DatabasePromptRepository(pgDatabaseConnection);

const handleIncomingMessage = new HandleIncomingMessage(
  GRAPH_API_TOKEN!,
  aiGateway,
  promptRepository,
  apiGateway
);
const handleChatSession = new HandleChatSession(
  aiGateway,
  promptRepository,
  apiGateway
);

const webhookController = new WebhookController(handleIncomingMessage);
const apiController = new ApiController(handleChatSession);
const server = new ExpressServer(webhookController, apiController);

server.start(PORT);
