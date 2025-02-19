import { DatabaseConnection } from "@/infrastructure/database/DatabaseConnection";
import { DatabaseSettingsGateway } from "@/infrastructure/gateways/DatabaseSettingsGateway";

class MockDatabaseConnection implements DatabaseConnection {
  private mockData: Map<string, string> = new Map();

  async query<T>(statement: string, params?: any): Promise<T> {
    if (statement.includes("SELECT")) {
      return Array.from(this.mockData.entries()).map(([key, value]) => ({
        key,
        value,
      })) as T;
    } else if (statement.includes("INSERT")) {
      const [key, value] = params;
      this.mockData.set(key, value);
      return [] as T;
    }
    return [] as T;
  }

  async one<T>(statement: string, params?: any): Promise<T> {
    throw new Error("Method not implemented.");
  }

  async close(): Promise<void> {}
}

describe("DatabaseSettingsGateway", () => {
  let dbConnection: MockDatabaseConnection;
  let settingsGateway: DatabaseSettingsGateway;

  beforeEach(() => {
    console.error = jest.fn();
    dbConnection = new MockDatabaseConnection();
    settingsGateway = new DatabaseSettingsGateway(dbConnection);
  });

  it("should return default values when no settings exist", async () => {
    const settings = await settingsGateway.getSettings();
    expect(settings.system_prompt).toBe("");
    expect(settings.session_duration).toBe(3600);
    expect(settings.llm_model).toBe("gpt-3.5-turbo");
  });

  it("should update and retrieve settings", async () => {
    await settingsGateway.updateSetting("system_prompt", "Test prompt");
    await settingsGateway.updateSetting("session_duration", "7200");
    await settingsGateway.updateSetting("llm_model", "gpt-4");

    const settings = await settingsGateway.getSettings();
    expect(settings.system_prompt).toBe("Test prompt");
    expect(settings.session_duration).toBe(7200);
    expect(settings.llm_model).toBe("gpt-4");
  });
});
