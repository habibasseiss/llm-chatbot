import { OptionList } from "@/domain/entities/Message";
import { ChatHistory } from "@/domain/entities/Prompt";
import { AIGateway } from "@/interfaces/gateways/AIGateway";
import { Ollama } from "ollama";

const DEFAULT_MODEL = "llama3.3";
const OLLAMA_OPTIONS = {
  num_ctx: 32768,
  temperature: 0.3,
  top_p: 0.2,
};

export class OllamaAIGateway implements AIGateway {
  private ollama;

  constructor(host: string) {
    this.ollama = new Ollama({ host });
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
    const response = await this.ollama.chat({
      messages: chatHistory.messages.map((message) => ({
        role: message.role,
        content: message.content,
      })),
      model: llmModel || DEFAULT_MODEL,
      options: OLLAMA_OPTIONS,
    });

    return response.message.content;
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

    const response = await this.ollama.chat({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt },
      ],
      model: llmModel || DEFAULT_MODEL,
      options: OLLAMA_OPTIONS,
    });

    return response.message.content;
  }
}
