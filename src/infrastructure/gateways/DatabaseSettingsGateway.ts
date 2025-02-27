import {
  APIGateway,
  GeneralSettings,
} from "../../interfaces/gateways/APIGateway";
import { DatabaseConnection } from "../database/DatabaseConnection";

export class DatabaseSettingsGateway implements APIGateway {
  constructor(private db: DatabaseConnection) {}

  async getSettings(): Promise<GeneralSettings> {
    const settings = await this.db.query<{ key: string; value: string }[]>(
      "SELECT key, value FROM settings WHERE key IN ($1, $2, $3)",
      ["system_prompt", "session_duration", "llm_model"]
    );

    const settingsMap = new Map(settings.map((s) => [s.key, s.value]));

    return {
      system_prompt: settingsMap.get("system_prompt") || "",
      session_duration: parseInt(
        settingsMap.get("session_duration") || "3600",
        10
      ),
      llm_model: settingsMap.get("llm_model") || "gpt-3.5-turbo",
    };
  }

  async updateSetting(key: string, value: string): Promise<void> {
    await this.db.query(
      `
      INSERT INTO settings (key, value) 
      VALUES ($1, $2)
      ON CONFLICT (key) DO UPDATE 
      SET value = $2, updated_at = CURRENT_TIMESTAMP
      `,
      [key, value]
    );
  }
}
