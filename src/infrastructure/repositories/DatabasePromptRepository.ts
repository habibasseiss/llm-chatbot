import { ChatHistory, Session } from "@/domain/entities/Prompt";
import { PromptRepository } from "@/domain/repositories/PromptRepository";
import { DatabaseConnection } from "@/infrastructure/database/DatabaseConnection";

export class DatabasePromptRepository implements PromptRepository {
  constructor(readonly connection: DatabaseConnection) {
  }

  async getSessionId(
    userId: string,
    userProfileName?: string,
    expiration_hours: number = 24,
  ): Promise<string> {
    // get the session for user_id or create a new one if expiration_hours has passed
    let query = `SELECT * FROM sessions
      WHERE
        user_id = $1
        AND closed = false
        AND created_at > NOW() - INTERVAL '${expiration_hours} hours'`;

    const sessions = await this.connection.query<Session[]>(query, [
      userId,
    ]);
    let session: Session;

    if (sessions.length === 0) {
      // If no session exists, create a new one
      query =
        `INSERT INTO sessions (user_id, user_profile_name) VALUES ($1, $2) RETURNING id`;
      session = await this.connection.one<Session>(query, [
        userId,
        userProfileName,
      ]);
    } else {
      // If a session exists, use the first one
      session = sessions[0];
    }

    return session.id;
  }

  async closeSession(sessionId: string, summary?: string): Promise<void> {
    if (summary) {
      const query =
        `UPDATE sessions SET closed = true, summary = $2 WHERE id = $1 AND summary IS NULL`;

      await this.connection.query(query, [sessionId, summary]);
    } else {
      const query = `UPDATE sessions SET closed = true WHERE id = $1`;

      await this.connection.query(query, [sessionId]);
    }
  }

  async getPromptHistory(sessionId: string): Promise<ChatHistory> {
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
        sessions.id = $1
      ORDER BY
        prompts.created_at ASC
    `;
    const result = await this.connection.query<any[]>(query, [sessionId]);

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
    sessionId,
  }: {
    content: string;
    role: string;
    sessionId: string;
  }): Promise<void> {
    const query =
      `INSERT INTO prompts (content, role, session_id) VALUES ($1, $2, $3)`;
    await this.connection.query(query, [
      content,
      role,
      sessionId,
    ]);
  }
}
