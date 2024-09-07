import { APIGateway } from "@/interfaces/gateways/APIGateway";
import axios from "axios";

export class HttpAPIGateway implements APIGateway {
  private apiUrl: string;
  private apiKey: string;

  constructor(apiUrl: string, apiKey: string) {
    this.apiUrl = apiUrl;
    this.apiKey = apiKey;
  }

  async getSystemPrompt(): Promise<string> {
    try {
      const response = await axios.get(`${this.apiUrl}/settings`, {
        headers: {
          "X-Api-Key": this.apiKey,
        },
      });
      const settings = response.data as GeneralSettings;
      return settings.system_prompt;
    } catch (error) {
      console.error("Error fetching system prompt:", error);
      throw new Error("Failed to fetch system prompt");
    }
  }
}

type GeneralSettings = {
  system_prompt: string;
};
