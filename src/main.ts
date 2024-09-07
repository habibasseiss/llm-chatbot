import { GroqAIGateway } from "@/infrastructure/gateways/GroqAIGateway";
import { HttpAPIGateway } from "@/infrastructure/gateways/HttpAPIGateway";
import { DatabasePromptRepository } from "@/infrastructure/repositories/DatabasePromptRepository";
import { ExpressServer } from "@/infrastructure/webserver/ExpressServer";
import { WebhookController } from "@/interfaces/controllers/WebhookController";
import { HandleIncomingMessage } from "@/usecases/message/HandleIncomingMessage";

const PORT = 3000;
const { GRAPH_API_TOKEN, GROQ_API_KEY, DATABASE_URL, API_URL, API_KEY } =
  process.env;

const aiGateway = new GroqAIGateway(GROQ_API_KEY!);
const apiGateway = new HttpAPIGateway(API_URL!, API_KEY!);
const promptRepository = new DatabasePromptRepository(
  DATABASE_URL!,
);

const handleIncomingMessage = new HandleIncomingMessage(
  GRAPH_API_TOKEN!,
  aiGateway,
  promptRepository,
  apiGateway,
);

const webhookController = new WebhookController(handleIncomingMessage);
const server = new ExpressServer(webhookController);

server.start(PORT);
