import { ChatHistory } from "@/domain/entities/Prompt";
import { AIMessageSchema, AIOptions } from "@/domain/types/LLMConfig";
import { AIGateway } from "@/interfaces/gateways/AIGateway";
import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { ChatCompletionMessageParam } from "openai/resources";

export class OpenAIAIGateway implements AIGateway {
  private openai;

  constructor(host: string | undefined, apiKey: string) {
    this.openai = new OpenAI({
      baseURL: host,
      apiKey: apiKey,
    });
  }

  async getAIResponse(
    chatHistory: ChatHistory,
    aiOptions: AIOptions
  ): Promise<string> {
    const messages: ChatCompletionMessageParam[] = chatHistory.messages.map(
      (message) => ({
        role: message.role,
        content: message.content,
      })
    );

    const response = await this.openai.chat.completions.create({
      model: aiOptions.model,
      messages: messages,
      response_format: zodResponseFormat(AIMessageSchema, "message_response"),
      temperature: aiOptions.temperature,
      top_p: aiOptions.top_p,
      max_tokens: aiOptions.max_tokens,
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("No content received from OpenAI");
    }

    return content;
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

    const response = await this.openai.chat.completions.create({
      model: aiOptions.model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt },
      ] as ChatCompletionMessageParam[], // Ensure correct typing
      response_format: {
        type: "json_object",
      },
      temperature: aiOptions.temperature,
      top_p: aiOptions.top_p,
      max_tokens: aiOptions.max_tokens,
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("No content received from OpenAI");
    }

    return content;
  }
}
