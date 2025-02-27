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
    expect(settings.llm_config.model).toBe("gpt-4");
    expect(settings.llm_config.temperature).toBe(0.7);
    expect(settings.llm_config.top_p).toBe(1);
    expect(settings.llm_config.max_tokens).toBe(1024);
  });

  it("should update and retrieve settings", async () => {
    await settingsGateway.updateSetting("system_prompt", "Test prompt");
    await settingsGateway.updateSetting("session_duration", 7200);

    // Update all llm_config properties at once
    await settingsGateway.updateSetting("llm_config", {
      model: "gpt-4",
      temperature: 0.8,
      top_p: 0.9,
      max_tokens: 2048,
    });

    const settings = await settingsGateway.getSettings();
    expect(settings.system_prompt).toBe("Test prompt");
    expect(settings.session_duration).toBe(7200);
    expect(settings.llm_config.model).toBe("gpt-4");
    expect(settings.llm_config.temperature).toBe(0.8);
    expect(settings.llm_config.top_p).toBe(0.9);
    expect(settings.llm_config.max_tokens).toBe(2048);
  });

  it("should get nested settings using dot notation", async () => {
    // Set up a complex nested setting
    await settingsGateway.updateSetting("complex_setting", {
      level1: {
        level2: {
          value: "nested value",
        },
        array: [1, 2, 3],
      },
    });

    // Test getting nested values
    const nestedValue = await settingsGateway.getSetting(
      "complex_setting.level1.level2.value",
      "default"
    );
    expect(nestedValue).toBe("nested value");

    // Test getting a nested object
    const level2 = await settingsGateway.getSetting(
      "complex_setting.level1.level2",
      {}
    );
    expect(level2).toEqual({ value: "nested value" });

    // Test getting an array element using a non-existent path
    const defaultValue = await settingsGateway.getSetting(
      "complex_setting.nonexistent.path",
      "default value"
    );
    expect(defaultValue).toBe("default value");
  });

  it("should update nested settings using dot notation", async () => {
    // First set up a base object
    await settingsGateway.updateSetting("nested_config", {
      level1: {
        value1: "original",
        level2: {
          value2: "original",
        },
      },
    });

    // Update a nested value using dot notation
    await settingsGateway.updateSetting(
      "nested_config.level1.value1",
      "updated"
    );
    await settingsGateway.updateSetting(
      "nested_config.level1.level2.value2",
      "updated"
    );

    // Add a new nested property
    await settingsGateway.updateSetting(
      "nested_config.level1.newProp",
      "new value"
    );

    // Verify all values
    const nestedConfig = await settingsGateway.getSetting<any>(
      "nested_config",
      {}
    );
    expect(nestedConfig.level1.value1).toBe("updated");
    expect(nestedConfig.level1.level2.value2).toBe("updated");
    expect(nestedConfig.level1.newProp).toBe("new value");

    // Verify individual property access
    const value1 = await settingsGateway.getSetting(
      "nested_config.level1.value1",
      "default"
    );
    expect(value1).toBe("updated");

    const value2 = await settingsGateway.getSetting(
      "nested_config.level1.level2.value2",
      "default"
    );
    expect(value2).toBe("updated");

    const newProp = await settingsGateway.getSetting(
      "nested_config.level1.newProp",
      "default"
    );
    expect(newProp).toBe("new value");
  });
});
