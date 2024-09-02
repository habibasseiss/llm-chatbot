import { ExpressServer } from "./infrastructure/webserver/ExpressServer";
import { WebhookController } from "./interfaces/controllers/WebhookController";
import { HandleIncomingMessage } from "./usecases/HandleIncomingMessage";

const PORT = 3000;
const { GRAPH_API_TOKEN } = process.env;

const handleIncomingMessage = new HandleIncomingMessage(
  GRAPH_API_TOKEN!,
  "business_phone_number_id",
);

const webhookController = new WebhookController(handleIncomingMessage);
const server = new ExpressServer(webhookController);

server.start(PORT);
