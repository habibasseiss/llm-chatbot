import { ChatHistory } from "@/domain/entities/Prompt";
import { AIGateway } from "@/interfaces/gateways/AIGateway";
import Groq from "groq-sdk";

export class GroqAIGateway implements AIGateway {
  private groq;

  constructor(apiKey: string) {
    this.groq = new Groq({ apiKey });
  }

  isFinalResponse(response: string): boolean {
    return response.includes("[closed]");
  }

  parseResponse(response: string): string {
    return response.replace(/\[.*?\]\s*/, "").trim();
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
      model: llmModel || "llama-3.1-8b-instant",
    });

    return response.choices[0]?.message?.content || "";
  }

  async getFinalAIResponse(
    prompt: string,
    llmModel?: string,
  ): Promise<string> {
    const systemPrompt = `
Você receberá um texto resumido de uma conversa e deverá convertê-lo em um JSON com a seguinte estrutura:
{
  "cidade": "",
  "titulo": "",
  "resumo": ""
}
Detecte a cidade, o título e faça um resumo contendo sobre tudo o que foi relatado na conversa. Não responda nada além do JSON. Se alguma informação não estiver presente, deixe o campo vazio. Ignore a última parte do texto com o agradecimento.
`;

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
