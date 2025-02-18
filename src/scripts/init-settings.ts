import { config } from "dotenv";
import { PostgresDatabaseConnection } from "../infrastructure/database/DatabaseConnection";
import { DatabaseSettingsGateway } from "../infrastructure/gateways/DatabaseSettingsGateway";

config();

async function initSettings() {
  const dbConnection = new PostgresDatabaseConnection(process.env.DATABASE_URL!);
  const settingsGateway = new DatabaseSettingsGateway(dbConnection);

  try {
    // Initialize default settings
    await settingsGateway.updateSetting("system_prompt", "You are a helpful AI assistant.");
    await settingsGateway.updateSetting("session_duration", "3600");
    await settingsGateway.updateSetting("llm_model", "gpt-3.5-turbo");

    console.log("Settings initialized successfully!");
  } catch (error) {
    console.error("Error initializing settings:", error);
  } finally {
    await dbConnection.close();
  }
}

initSettings();
