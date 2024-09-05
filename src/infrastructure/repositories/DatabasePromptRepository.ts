import { ChatHistory, Prompt } from "@/domain/entities/Prompt";
import { PromptRepository } from "@/interfaces/repositories/PromptRepository";
import { Pool } from "pg";

export class DatabasePromptRepository implements PromptRepository {
  private prompts: { [key: string]: Prompt[] } = {};

  private pool: Pool;

  constructor(connectionString: string) {
    this.pool = new Pool({
      connectionString,
    });
  }

  async getPromptHistory(userId: string): Promise<ChatHistory> {
    const query = `
      SELECT *
      FROM prompts 
      WHERE user_id = $1
      ORDER BY created_at ASC
    `;
    const result = await this.pool.query(query, [userId]);

    return {
      messages: [
        ...result.rows.map((row) => ({
          id: row.id,
          content: row.content,
          role: row.role,
          user_id: row.user_id,
          user_profile_name: row.user_profile_name,
        })),
      ],
    };
  }

  async savePrompt({
    content,
    role,
    user_id,
    user_profile_name,
  }: {
    content: string;
    role: string;
    user_id: string;
    user_profile_name?: string;
  }): Promise<void> {
    const query =
      `INSERT INTO prompts (content, role, user_id, user_profile_name) VALUES ($1, $2, $3, $4)`;
    await this.pool.query(query, [
      content,
      role,
      user_id,
      user_profile_name,
    ]);
  }
}
