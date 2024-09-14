import { ChatHistory, Session } from "@/domain/entities/Prompt";
import { PromptRepository } from "@/domain/repositories/PromptRepository";
import { DatabaseConnection } from "@/infrastructure/database/DatabaseConnection";

export class DatabasePromptRepository implements PromptRepository {
  constructor(readonly connection: DatabaseConnection) {
  }

  async getPromptHistory(userId: string): Promise<ChatHistory> {
    const query = `
      SELECT
        prompts.*,
        sessions.id AS sessions_id,
        sessions.user_id AS sessions_user_id,
        sessions.user_profile_name AS sessions_user_profile_name,
        sessions.created_at AS sessions_created_at
      FROM
        prompts
        JOIN sessions AS sessions ON prompts.session_id = sessions.id
      WHERE
        user_id = '12345'
      ORDER BY
        prompts.created_at ASC
    `;
    const result = await this.connection.query<any[]>(query, [userId]);

    return {
      messages: [
        ...result.map((row) => ({
          id: row.id,
          content: row.content,
          role: row.role,
          session: {
            id: row.sessions_id,
            user_id: row.sessions_user_id,
            user_profile_name: row.sessions_user_profile_name,
            created_at: row.sessions_created_at,
          },
          created_at: row.created_at,
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
    let query =
      `INSERT INTO sessions (user_id, user_profile_name) VALUES ($1, $2) RETURNING id`;
    const session = await this.connection.one<Session>(query, [
      user_id,
      user_profile_name,
    ]);

    query =
      `INSERT INTO prompts (content, role, session_id) VALUES ($1, $2, $3)`;
    await this.connection.query(query, [
      content,
      role,
      session.id,
    ]);
  }
}
