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
    const isFinalResponse = response.includes("[closed]");
    const cleanedResponse = response.replace(/\[.*\]\s*/, "").trim();

    const regex = /\[options\]([\s\S]*?)\[\/options\]/;
    const match = response.match(regex);
    const optionsText = match ? match[1].trim() : null;
    const optionList = optionsText?.split(/\r?\n/) ?? [];

    return [cleanedResponse, isFinalResponse, { options: optionList }];
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

  async getFinalAISummary(
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
Detecte a cidade, o título e faça um resumo contendo sobre tudo o que foi relatado na conversa. Não responda nada além do JSON. Se alguma informação não estiver presente, deixe o campo vazio. Ignore a última parte do texto com o agradecimento. Use sempre Português do Brasil.
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

  async getPartialAISummary(
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
