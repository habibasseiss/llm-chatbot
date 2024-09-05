import { GroqAIGateway } from "@/infrastructure/gateways/GroqAIGateway";
import { InMemoryPromptRepository } from "@/infrastructure/repositories/PromptRepository";
import { ExpressServer } from "@/infrastructure/webserver/ExpressServer";
import { WebhookController } from "@/interfaces/controllers/WebhookController";
import { HandleIncomingMessage } from "@/usecases/HandleIncomingMessage";

const PORT = 3000;
const { GRAPH_API_TOKEN, GROQ_API_KEY } = process.env;

const aiGateway = new GroqAIGateway(GROQ_API_KEY!);
const promptRepository = new InMemoryPromptRepository();

const handleIncomingMessage = new HandleIncomingMessage(
  GRAPH_API_TOKEN!,
  aiGateway,
  promptRepository,
);

const webhookController = new WebhookController(handleIncomingMessage);
const server = new ExpressServer(webhookController);

server.start(PORT);
