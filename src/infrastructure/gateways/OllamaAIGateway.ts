import { ChatHistory } from "@/domain/entities/Prompt";
import { AIMessageSchema, AIOptions } from "@/domain/types/LLMConfig";
import { AIGateway } from "@/interfaces/gateways/AIGateway";
import { Ollama } from "ollama";
import { zodResponseFormat } from "openai/helpers/zod";

export class OllamaAIGateway implements AIGateway {
  private ollama;

  constructor(host: string) {
    this.ollama = new Ollama({ host });
  }

  async getAIResponse(
    chatHistory: ChatHistory,
    aiOptions: AIOptions
  ): Promise<string> {
    const response = await this.ollama.chat({
      messages: chatHistory.messages.map((message) => ({
        role: message.role,
        content: message.content,
      })),
      format: zodResponseFormat(AIMessageSchema, "message_response").json_schema
        .schema,
      model: aiOptions.model,
      options: {
        num_ctx: aiOptions.max_tokens,
        temperature: aiOptions.temperature,
        top_p: aiOptions.top_p,
      },
      stream: false,
    });

    return response.message.content;
  }

  async getAISummary(
    chatHistory: ChatHistory,
    aiOptions: AIOptions
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
      model: aiOptions.model,
      options: {
        num_ctx: aiOptions.max_tokens,
        temperature: aiOptions.temperature,
        top_p: aiOptions.top_p,
      },
      stream: false,
    });

    return response.message.content;
  }
}
