import axios from "axios";
import express, { Request, Response } from "express";

const app = express();
app.use(express.json());

const { WEBHOOK_VERIFY_TOKEN, GRAPH_API_TOKEN } = process.env;
const PORT = 3000;

interface WebhookRequest extends Request {
  body: {
    entry?: [
      {
        changes: [
          {
            value: {
              messages?: [
                {
                  type: string;
                  from: string;
                  text: { body: string };
                  id: string;
                },
              ];
              metadata?: { phone_number_id: string };
            };
          },
        ];
      },
    ];
  };
}

app.post("/webhook", async (req: WebhookRequest, res: Response) => {
  console.log("Incoming webhook message:", JSON.stringify(req.body, null, 2));

  const message = req.body.entry?.[0]?.changes[0]?.value?.messages?.[0];

  if (message?.type === "text") {
    const business_phone_number_id = req.body.entry?.[0].changes?.[0].value
      ?.metadata?.phone_number_id;

    try {
      await axios({
        method: "POST",
        url:
          `https://graph.facebook.com/v18.0/${business_phone_number_id}/messages`,
        headers: {
          Authorization: `Bearer ${GRAPH_API_TOKEN}`,
        },
        data: {
          messaging_product: "whatsapp",
          to: message.from,
          text: { body: "Echo: " + message.text.body },
          context: {
            message_id: message.id,
          },
        },
      });
    } catch (error) {
      console.log(error);
    }

    try {
      await axios({
        method: "POST",
        url:
          `https://graph.facebook.com/v18.0/${business_phone_number_id}/messages`,
        headers: {
          Authorization: `Bearer ${GRAPH_API_TOKEN}`,
        },
        data: {
          messaging_product: "whatsapp",
          status: "read",
          message_id: message.id,
        },
      });
    } catch (error) {
      console.log(error);
    }
  }

  res.sendStatus(200);
});

app.get("/webhook", (req: Request, res: Response) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === WEBHOOK_VERIFY_TOKEN) {
    res.status(200).send(challenge);
    console.log("Webhook verified successfully!");
  } else {
    res.sendStatus(403);
  }
});

app.get("/", (req: Request, res: Response) => {
  res.send(`<pre>Nothing to see here.</pre>`);
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server is listening on port: ${PORT}`);
});
