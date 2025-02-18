import { ChatHistory } from "@/domain/entities/Prompt";
import { AIGateway } from "@/interfaces/gateways/AIGateway";
import { Ollama } from "ollama";

const DEFAULT_MODEL = "llama3.2-vision";
const OLLAMA_OPTIONS = {
  num_ctx: 8192,
  temperature: 0.3,
  top_p: 0.2,
};

export class OllamaAIGateway implements AIGateway {
  private ollama;

  constructor(host: string) {
    this.ollama = new Ollama({ host });
  }

  async getAIResponse(
    chatHistory: ChatHistory,
    llmModel?: string
  ): Promise<string> {
    const response = await this.ollama.chat({
      messages: chatHistory.messages.map((message) => ({
        role: message.role,
        content: message.content,
      })),
      format: {
        type: "object",
        properties: {
          bot: {
            type: "string",
          },
          options: {
            type: "array",
            items: {
              type: "string",
            },
          },
          closed: {
            type: "boolean",
          },
        },
        required: ["bot"],
      },
      model: llmModel || DEFAULT_MODEL,
      options: OLLAMA_OPTIONS,
      stream: false,
    });

    return response.message.content;
  }

  async getAISummary(
    chatHistory: ChatHistory,
    llmModel?: string
  ): Promise<string> {
    const systemPrompt = `Você receberá uma conversa e deverá convertê-lo em um JSON. Detecte a cidade, o título e faça um resumo contendo sobre tudo o que foi relatado na conversa. Se alguma informação não estiver presente, deixe o campo vazio. Não forneça informações a mais do que as que estão presentes na conversa. Use sempre Português do Brasil.`;

    const prompt = chatHistory.messages
      .filter((message) => message.role !== "system")
      .map((message) => `${message.role}: ${message.content}`)
      .join("\n");

    const response = await this.ollama.chat({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt },
      ],
      format: {
        type: "object",
        properties: {
          cidade: {
            type: "string",
          },
          titulo: {
            type: "string",
          },
          resumo: {
            type: "string",
          },
        },
        required: ["cidade", "titulo", "resumo"],
      },
      model: llmModel || DEFAULT_MODEL,
      options: OLLAMA_OPTIONS,
      stream: false,
    });

    return response.message.content;
  }
}
