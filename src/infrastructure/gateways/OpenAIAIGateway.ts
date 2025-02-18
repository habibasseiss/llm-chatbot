import { OptionList } from "@/domain/entities/Message";
import { ChatHistory } from "@/domain/entities/Prompt";
import { AIGateway } from "@/interfaces/gateways/AIGateway";
import OpenAI from "openai";
import { ChatCompletionMessageParam } from "openai/resources";

const DEFAULT_MODEL = "microsoft/phi-4";
const OLLAMA_OPTIONS = {
  temperature: 0.3,
  top_p: 0.2,
};

export class OpenAIAIGateway implements AIGateway {
  private openai;

  constructor(host: string, apiKey: string) {
    this.openai = new OpenAI({
      baseURL: host,
      apiKey: apiKey,
    });
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
    llmModel?: string
  ): Promise<string> {
    const messages: ChatCompletionMessageParam[] = chatHistory.messages.map(
      (message) => ({
        role: message.role as "system" | "user" | "assistant",
        content: message.content,
      })
    );

    const response = await this.openai.chat.completions.create({
      model: llmModel || DEFAULT_MODEL,
      messages: messages,
      response_format: {
        type: "json_object",
      },
      temperature: OLLAMA_OPTIONS?.temperature || 0.7,
      max_tokens: null,
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("No content received from OpenAI");
    }

    return content;
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

    const response = await this.openai.chat.completions.create({
      model: llmModel || "gpt-4", // Adjust model as needed
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt },
      ] as ChatCompletionMessageParam[], // Ensure correct typing
      response_format: {
        type: "json_object",
      },
      temperature: OLLAMA_OPTIONS?.temperature || 0.7,
      max_tokens: null,
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("No content received from OpenAI");
    }

    return content;
  }
}
