import { Pool } from "pg";
import { DatabasePromptRepository } from "../../src/infrastructure/repositories/DatabasePromptRepository";

jest.mock("pg", () => {
  const mPool = {
    query: jest.fn(),
    end: jest.fn(),
  };
  return { Pool: jest.fn(() => mPool) };
});

describe("PostgresMessageRepository", () => {
  let repo: DatabasePromptRepository;
  let pool: jest.Mocked<Pool>;

  beforeEach(() => {
    pool = new Pool() as jest.Mocked<Pool>;
    repo = new DatabasePromptRepository("postgres://test");
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // it("should fetch chat history", async () => {
  //   const mockMessages: ChatHistory = {
  //     messages: [
  //       {
  //         id: "msg1",
  //         role: "user",
  //         content: "Hello",
  //         user_id: "12345",
  //         user_profile_name: "Test user",
  //       },
  //       {
  //         id: "msg2",
  //         role: "system",
  //         content: "Hi",
  //         user_id: "12345",
  //         user_profile_name: "Test user",
  //       },
  //     ],
  //   };
  //   pool.query.mockResolvedValue({ rows: mockMessages });

  //   const result = await repo.getPromptHistory("12345");

  //   expect(result).toHaveLength(2);
  //   expect(result[0].id).toBe("msg1");
  //   expect(result[0].text.body).toBe("Hello");
  //   expect(result[1].id).toBe("msg2");
  // });

  it("should save a prompt", async () => {
    const prompt = {
      role: "user",
      content: "Test message",
      user_id: "12345",
      user_profile_name: "Test user",
    };

    await repo.savePrompt(prompt);

    expect(pool.query).toHaveBeenCalledWith(
      `INSERT INTO prompts (content, role, user_id, user_profile_name) VALUES ($1, $2, $3, $4)`,
      ["Test message", "user", "12345", "Test user"],
    );
  });
});
