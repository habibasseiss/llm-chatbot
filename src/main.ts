import { PostgresDatabaseConnection } from "@/infrastructure/database/DatabaseConnection";
import { HttpAPIGateway } from "@/infrastructure/gateways/HttpAPIGateway";
import { DatabasePromptRepository } from "@/infrastructure/repositories/DatabasePromptRepository";
import { ExpressServer } from "@/infrastructure/webserver/ExpressServer";
import { WebhookController } from "@/interfaces/controllers/WebhookController";
import { HandleIncomingMessage } from "@/usecases/message/HandleIncomingMessage";
import dotenv from "dotenv";
import { OllamaAIGateway } from "./infrastructure/gateways/OllamaAIGateway";
import { ApiController } from "./interfaces/controllers/ApiController";
import { HandleChatSession } from "./usecases/message/HandleChatSession";

dotenv.config();

const PORT = 3000;
const { GRAPH_API_TOKEN, OLLAMA_HOST, DATABASE_URL, API_URL, API_KEY } =
  process.env;

const aiGateway = new OllamaAIGateway(OLLAMA_HOST!);
const apiGateway = new HttpAPIGateway(API_URL!, API_KEY!);
const pgDatabaseConnection = new PostgresDatabaseConnection(DATABASE_URL!);
const promptRepository = new DatabasePromptRepository(pgDatabaseConnection);

const handleIncomingMessage = new HandleIncomingMessage(
  GRAPH_API_TOKEN!,
  aiGateway,
  promptRepository,
  apiGateway,
);
const handleChatSession = new HandleChatSession(
  aiGateway,
  promptRepository,
  apiGateway,
);

const webhookController = new WebhookController(handleIncomingMessage);
const apiController = new ApiController(handleChatSession);
const server = new ExpressServer(webhookController, apiController);

server.start(PORT);
