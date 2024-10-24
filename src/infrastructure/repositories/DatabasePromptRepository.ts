import { ChatHistory, Session } from "@/domain/entities/Prompt";
import { PromptRepository } from "@/domain/repositories/PromptRepository";
import { DatabaseConnection } from "@/infrastructure/database/DatabaseConnection";

export class DatabasePromptRepository implements PromptRepository {
  constructor(readonly connection: DatabaseConnection) {
  }

  async closeSession(
    userId: string,
    expiration_hours: number = 24,
  ): Promise<void> {
    // get the session for userId
    let query =
      `SELECT * FROM sessions WHERE user_id = $1 AND created_at > NOW() - INTERVAL '${expiration_hours} hours' ORDER BY created_at DESC`;
    const sessions = await this.connection.query<Session[]>(query, [
      userId,
    ]);

    if (sessions.length !== 0) {
      const session = sessions[0];

      query = `UPDATE sessions SET closed = true WHERE id = $1`;
      await this.connection.query(query, [session.id]);
    }
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
        user_id = $1
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
  }, expiration_hours: number = 24): Promise<void> {
    // get the session for user_id or create a new one if expiration_hours has passed
    let query =
      `SELECT * FROM sessions WHERE user_id = $1 AND created_at > NOW() - INTERVAL '${expiration_hours} hours'`;
    const sessions = await this.connection.query<Session[]>(query, [
      user_id,
    ]);
    let session: Session;

    if (sessions.length === 0) {
      // If no session exists, create a new one
      query =
        `INSERT INTO sessions (user_id, user_profile_name) VALUES ($1, $2) RETURNING id`;
      session = await this.connection.one<Session>(query, [
        user_id,
        user_profile_name,
      ]);
    } else {
      // If a session exists, use the first one
      session = sessions[0];
    }

    query =
      `INSERT INTO prompts (content, role, session_id) VALUES ($1, $2, $3)`;
    await this.connection.query(query, [
      content,
      role,
      session.id,
    ]);
  }
}
