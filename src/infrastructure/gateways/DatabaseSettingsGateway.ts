import { LLMConfig } from "../../domain/types/LLMConfig";
import {
  APIGateway,
  GeneralSettings,
} from "../../interfaces/gateways/APIGateway";
import { DatabaseConnection } from "../database/DatabaseConnection";

export class DatabaseSettingsGateway implements APIGateway {
  constructor(private db: DatabaseConnection) {}

  async getSettings(): Promise<GeneralSettings> {
    const settings = await this.db.query<{ key: string; value: string }[]>(
      "SELECT key, value FROM settings"
    );

    const settingsMap = new Map(
      settings.map((s) => {
        try {
          return [s.key, JSON.parse(s.value)];
        } catch (error) {
          return [s.key, s.value];
        }
      })
    );

    // Get LLM config or use defaults
    let llmConfig: LLMConfig;

    // Check if we have llm_config in the database
    const storedLLMConfig = settingsMap.get("llm_config");

    if (storedLLMConfig && typeof storedLLMConfig === "object") {
      // Use stored config with defaults for missing properties
      llmConfig = {
        model: storedLLMConfig.model || "gpt-4",
        temperature: storedLLMConfig.temperature ?? 0.7,
        top_p: storedLLMConfig.top_p ?? 1,
        max_tokens: storedLLMConfig.max_tokens ?? 1024,
      };
    } else {
      // Use complete default config
      llmConfig = {
        model: "gpt-4",
        temperature: 0.7,
        top_p: 1,
        max_tokens: 1024,
      };
    }

    return {
      system_prompt: settingsMap.get("system_prompt") || "",
      session_duration: settingsMap.get("session_duration") || 3600,
      llm_config: llmConfig,
    };
  }

  async updateSetting(key: string, value: any): Promise<void> {
    // If the key contains dots, it's a nested path
    if (key.includes(".")) {
      const [rootKey, ...nestedPath] = key.split(".");

      // Get the current value of the root setting
      let currentValue: Record<string, any> = await this.getSetting(
        rootKey,
        {}
      );

      // If currentValue is not an object, we need to reset it to an empty object
      if (typeof currentValue !== "object" || currentValue === null) {
        currentValue = {};
      }

      // Create a deep copy to avoid modifying the original object
      const updatedValue = JSON.parse(JSON.stringify(currentValue));

      // Update the nested property
      let target: Record<string, any> = updatedValue;
      const lastKey = nestedPath.pop()!;

      // Navigate to the target object
      for (const pathPart of nestedPath) {
        if (!target[pathPart] || typeof target[pathPart] !== "object") {
          target[pathPart] = {};
        }
        target = target[pathPart] as Record<string, any>;
      }

      // Set the value
      target[lastKey] = value;

      // Save the updated root object
      const jsonValue = JSON.stringify(updatedValue);

      await this.db.query(
        `
        INSERT INTO settings (key, value) 
        VALUES ($1, $2)
        ON CONFLICT (key) DO UPDATE 
        SET value = $2, updated_at = CURRENT_TIMESTAMP
        `,
        [rootKey, jsonValue]
      );
    } else {
      // Direct key update
      const jsonValue = JSON.stringify(value);

      await this.db.query(
        `
        INSERT INTO settings (key, value) 
        VALUES ($1, $2)
        ON CONFLICT (key) DO UPDATE 
        SET value = $2, updated_at = CURRENT_TIMESTAMP
        `,
        [key, jsonValue]
      );
    }
  }

  async getSetting<T>(key: string, defaultValue: T): Promise<T> {
    // If the key contains dots, it's a nested path
    if (key.includes(".")) {
      const [rootKey, ...nestedPath] = key.split(".");

      // Get the root object
      const rootValue: Record<string, any> | null = await this.getSetting(
        rootKey,
        null
      );

      if (rootValue === null) {
        return defaultValue;
      }

      // Navigate to the nested property
      let value: any = rootValue;
      for (const pathPart of nestedPath) {
        if (!value || typeof value !== "object" || !(pathPart in value)) {
          return defaultValue;
        }
        value = value[pathPart];
      }

      return value as unknown as T;
    }

    // Direct key retrieval
    const result = await this.db.query<{ value: string }[]>(
      "SELECT value FROM settings WHERE key = $1",
      [key]
    );

    if (result.length === 0) {
      return defaultValue;
    }

    try {
      return JSON.parse(result[0].value) as T;
    } catch (error) {
      console.error(`Error parsing JSON for setting ${key}:`, error);
      return defaultValue;
    }
  }
}
