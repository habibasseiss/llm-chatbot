import { AIGateway } from "@/interfaces/gateways/AIGateway";
import Groq from "groq-sdk";

export class GroqAIGateway implements AIGateway {
  private groq;

  constructor(apiKey: string) {
    this.groq = new Groq({ apiKey });
  }

  async getAIResponse(message: string): Promise<string> {
    const response = await this.groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: message,
        },
      ],
      model: "llama-3.1-8b-instant",
    });

    return response.choices[0]?.message?.content || "";
  }
}
