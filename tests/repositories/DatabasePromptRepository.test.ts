import migrate from "node-pg-migrate";
import { Prompt, Role, Session } from "../../src/domain/entities/Prompt";
import { PromptRepository } from "../../src/domain/repositories/PromptRepository";
import {
  DatabaseConnection,
  PostgresDatabaseConnection,
} from "../../src/infrastructure/database/DatabaseConnection";
import { DatabasePromptRepository } from "../../src/infrastructure/repositories/DatabasePromptRepository";

describe("Test PostgresMessageRepository", () => {
  let databaseUrl: string;
  let repository: PromptRepository;
  let connection: DatabaseConnection;

  beforeAll(async () => {
    databaseUrl = process.env.TEST_DATABASE_URL!;
  });

  beforeEach(async () => {
    connection = new PostgresDatabaseConnection(databaseUrl);

    await migrate({
      databaseUrl: databaseUrl,
      dir: "migrations",
      direction: "down",
      migrationsTable: "pgmigrations",
      decamelize: true,
      count: Infinity,
      verbose: false,
      log: () => {},
    });

    await migrate({
      databaseUrl: databaseUrl,
      dir: "migrations",
      direction: "up",
      migrationsTable: "pgmigrations",
      decamelize: true,
      verbose: false,
      log: () => {},
    });

    repository = new DatabasePromptRepository(connection);
  });

  afterEach(async () => {
    await connection.close();
  });

  it("should save a prompt", async () => {
    const prompt = {
      content: "Test message",
      role: "user" as Role,
      user_id: "12345",
      user_profile_name: "Test user",
    };

    await repository.savePrompt(prompt);

    const sessions = await connection.query<Session[]>(
      "SELECT * FROM sessions WHERE user_id = $1",
      ["12345"],
    );
    expect(sessions[0].user_profile_name).toBe("Test user");

    const prompts = await connection.query<Prompt[]>(
      "SELECT * FROM prompts WHERE session_id = $1",
      [sessions[0].id],
    );
    expect(prompts).toHaveLength(1);
  });

  it("should save different sessions if users are different", async () => {
    const prompt1 = {
      content: "Test message",
      role: "user" as Role,
      user_id: "12345",
      user_profile_name: "Test user",
    };

    const prompt2 = {
      content: "Test message",
      role: "user" as Role,
      user_id: "54321",
      user_profile_name: "Test user",
    };

    await repository.savePrompt(prompt1);
    await repository.savePrompt(prompt2);

    const sessions = await connection.query<Session[]>(
      "SELECT * FROM sessions",
    );
    expect(sessions).toHaveLength(2);
  });

  it("should get prompt history", async () => {
    const prompt1 = {
      content: "Test message",
      role: "user" as Role,
      user_id: "12345",
      user_profile_name: "Test user",
    };
    const prompt2 = {
      content: "Test message 2",
      role: "user" as Role,
      user_id: "12345",
      user_profile_name: "Test user",
    };

    await repository.savePrompt(prompt1);
    await repository.savePrompt(prompt2);

    const chatHistory = await repository.getPromptHistory("12345");
    expect(chatHistory.messages).toHaveLength(2);
    expect(chatHistory.messages[0].content).toBe("Test message");

    let sessions = await connection.query<Session[]>(
      "SELECT * FROM sessions WHERE user_id = $1",
      ["12345"],
    );

    expect(sessions).toHaveLength(1);

    // save prompt with 0 expiration hours
    await repository.savePrompt(prompt1, 0);
    sessions = await connection.query<Session[]>(
      "SELECT * FROM sessions WHERE user_id = $1",
      ["12345"],
    );
    expect(sessions).toHaveLength(2);
  });
});
