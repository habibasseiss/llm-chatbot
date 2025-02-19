import { Prompt, Role, Session } from "@/domain/entities/Prompt";
import { PromptRepository } from "@/domain/repositories/PromptRepository";
import {
  DatabaseConnection,
  PostgresDatabaseConnection,
} from "@/infrastructure/database/DatabaseConnection";
import { DatabasePromptRepository } from "@/infrastructure/repositories/DatabasePromptRepository";
import { randomUUID } from "crypto";
import migrate from "node-pg-migrate";

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
    const sessionId = await repository.getSessionId("12345", "Test user");

    const prompt = {
      content: "Test message",
      role: "user" as Role,
      sessionId: sessionId,
    };

    await repository.savePrompt(prompt);

    const sessions = await connection.query<Session[]>(
      "SELECT * FROM sessions WHERE user_id = $1",
      ["12345"]
    );
    expect(sessions[0].user_profile_name).toBe("Test user");

    const prompts = await connection.query<Prompt[]>(
      "SELECT * FROM prompts WHERE session_id = $1",
      [sessions[0].id]
    );
    expect(prompts).toHaveLength(1);
  });

  it("should have different sessions if users are different", async () => {
    const sessionId = await repository.getSessionId("12345", "Test user");
    const sessionId2 = await repository.getSessionId("54321", "Test user");

    const sessions = await connection.query<Session[]>(
      "SELECT * FROM sessions"
    );
    expect(sessions).toHaveLength(2);
    expect(sessionId).not.toBe(sessionId2);
  });

  it("should get prompt history", async () => {
    const uuid = randomUUID();
    const sessionId = await repository.getSessionId(uuid, "Test user");

    const prompt1 = {
      content: "Test message",
      role: "user" as Role,
      sessionId: sessionId,
    };
    const prompt2 = {
      content: "Test message 2",
      role: "user" as Role,
      sessionId: sessionId,
    };

    await repository.savePrompt(prompt1);
    await repository.savePrompt(prompt2);

    const chatHistory = await repository.getPromptHistory(sessionId);
    expect(chatHistory.messages).toHaveLength(2);
    expect(chatHistory.messages[0].content).toBe("Test message");

    let sessions = await connection.query<Session[]>(
      "SELECT * FROM sessions WHERE user_id = $1",
      [uuid]
    );

    expect(sessions).toHaveLength(1);

    // get session with 0 expiration hours (should return have a new session)
    const sessionId2 = await repository.getSessionId(uuid, "Test user", 0);
    const prompt3 = {
      content: "Test message 2",
      role: "user" as Role,
      sessionId: sessionId2,
    };
    await repository.savePrompt(prompt3);
    sessions = await connection.query<Session[]>(
      "SELECT * FROM sessions WHERE user_id = $1",
      [uuid]
    );
    expect(sessions).toHaveLength(2);
  });
});
