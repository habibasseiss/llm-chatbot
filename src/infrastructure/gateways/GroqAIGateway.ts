import { OptionList } from "@/domain/entities/Message";
import { ChatHistory } from "@/domain/entities/Prompt";
import { AIGateway } from "@/interfaces/gateways/AIGateway";
import Groq from "groq-sdk";

export class GroqAIGateway implements AIGateway {
  private groq;

  constructor(apiKey: string) {
    this.groq = new Groq({ apiKey });
  }

  parseResponse(response: string): [string, boolean, OptionList] {
    let replyText = "";
    let optionList: string[] = [];
    let isFinalResponse = false;

    // Check if the response is a JSON string
    const regex = /```json([\s\S]*?)```/;
    const match = response.match(regex);
    let jsonContent = "";

    if (match) {
      // response has a ```json block
      jsonContent = match[1].trim();
    } else {
      jsonContent = response;
    }

    // try to parse response as a json string
    try {
      const responseObj = JSON.parse(jsonContent);

      replyText = responseObj.bot;

      if (responseObj.options) {
        optionList = responseObj.options;
      }

      if (responseObj.closed === true) {
        isFinalResponse = true;
      }

      return [replyText, isFinalResponse, { options: optionList }];
    } catch (_) {
      // response is not a json string (parse error)
    }

    // response is not a json string
    console.log("No JSON response detected, using raw response.");
    replyText = response;

    return [replyText, isFinalResponse, { options: optionList }];
  }

  async getAIResponse(
    chatHistory: ChatHistory,
    llmModel?: string,
  ): Promise<string> {
    const response = await this.groq.chat.completions.create({
      messages: chatHistory.messages.map((message) => ({
        role: message.role,
        content: message.content,
      })),
      model: llmModel || "llama-3.1-70b-versatile",
      temperature: 0.3,
      top_p: 0.2,
    });

    return response.choices[0]?.message?.content || "";
  }

  async getAISummary(
    chatHistory: ChatHistory,
    llmModel?: string,
  ): Promise<string> {
    const systemPrompt = `
Você receberá uma conversa e deverá convertê-lo em um JSON com a seguinte estrutura:
{
  "cidade": "",
  "titulo": "",
  "resumo": ""
}
Detecte a cidade, o título e faça um resumo contendo sobre tudo o que foi relatado na conversa. Não responda nada além do JSON. Se alguma informação não estiver presente, deixe o campo vazio. Use sempre Português do Brasil.
`;

    const prompt = chatHistory.messages
      .filter((message) => message.role !== "system")
      .map((message) => `${message.role}: ${message.content}`)
      .join("\n");

    const response = await this.groq.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt },
      ],
      model: llmModel || "llama-3.1-8b-instant",
    });

    return response.choices[0]?.message?.content || "";
  }
}
