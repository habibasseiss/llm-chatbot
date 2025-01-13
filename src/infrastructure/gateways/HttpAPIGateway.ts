import { APIGateway, GeneralSettings } from "@/interfaces/gateways/APIGateway";
import axios from "axios";

export class HttpAPIGateway implements APIGateway {
  private apiUrl: string;
  private apiKey: string;

  constructor(apiUrl: string, apiKey: string) {
    this.apiUrl = apiUrl;
    this.apiKey = apiKey;
  }

  async getSettings(): Promise<GeneralSettings> {
    try {
      const response = await axios.get(`${this.apiUrl}/settings`, {
        headers: {
          "X-Api-Key": this.apiKey,
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "Pragma": "no-cache",
          "Expires": "0"
        },
      });
      return response.data as GeneralSettings;
    } catch (error) {
      console.error("Error fetching system prompt:", error);
      throw new Error("Failed to fetch system prompt");
    }
  }
}
