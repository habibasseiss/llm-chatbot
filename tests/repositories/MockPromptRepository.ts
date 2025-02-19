import { ChatHistory, Role } from "@/domain/entities/Prompt";
import { PromptRepository } from "@/domain/repositories/PromptRepository";

export class MockPromptRepository implements PromptRepository {
  private sessions: {
    [key: string]: {
      userId: string;
      userProfileName: string;
      createdAt: Date;
      closed: boolean;
    };
  } = {};
  private prompts: {
    [key: string]: {
      content: string;
      role: Role;
      sessionId: string;
      createdAt: Date;
    }[];
  } = {};

  async getSessionId(
    userId: string,
    userProfileName: string,
    expiration_hours: number = 24
  ): Promise<string> {
    // Look for an existing session that is not expired
    const now = new Date();
    let existingSession = Object.values(this.sessions).find(
      (session) =>
        session.userId === userId &&
        (now.getTime() - new Date(session.createdAt).getTime()) /
          (1000 * 60 * 60) <
          expiration_hours &&
        !session.closed
    );

    if (existingSession) {
      return Object.keys(this.sessions).find(
        (key) => this.sessions[key] === existingSession
      )!;
    }

    // Create a new session if no existing session is found or expired
    const sessionId = `session-${Object.keys(this.sessions).length + 1}`;
    this.sessions[sessionId] = {
      userId,
      userProfileName,
      createdAt: new Date(),
      closed: false,
    };
    return sessionId;
  }

  async getPromptHistory(sessionId: string): Promise<ChatHistory> {
    // Fetch all prompts for the given session
    const sessionPrompts = this.prompts[sessionId] || [];
    return {
      messages: sessionPrompts.map((prompt) => ({
        id: `${sessionId}-${prompt.createdAt.getTime()}`,
        content: prompt.content,
        role: prompt.role,
        session: {
          id: sessionId,
          user_id: this.sessions[sessionId].userId,
          user_profile_name: this.sessions[sessionId].userProfileName,
          created_at: this.sessions[sessionId].createdAt,
        },
        created_at: prompt.createdAt,
      })),
    };
  }

  async savePrompt({
    content,
    role,
    sessionId,
  }: {
    content: string;
    role: Role;
    sessionId: string;
  }): Promise<void> {
    // Ensure that the session exists
    if (!this.sessions[sessionId]) {
      throw new Error(`Session with id ${sessionId} not found`);
    }

    // Save the prompt in the session
    if (!this.prompts[sessionId]) {
      this.prompts[sessionId] = [];
    }

    this.prompts[sessionId].push({
      content,
      role,
      sessionId,
      createdAt: new Date(),
    });
  }

  async closeSession(sessionId: string): Promise<void> {
    // Close the session if it exists
    if (!this.sessions[sessionId]) {
      throw new Error(`Session with id ${sessionId} not found`);
    }

    this.sessions[sessionId].closed = true;
  }
}
