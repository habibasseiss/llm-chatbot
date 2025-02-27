import { z } from "zod";

/**
 * Common interface for LLM configuration options
 * Used across different parts of the application
 */
export interface LLMConfig {
  model: string;
  temperature: number;
  top_p: number;
  max_tokens: number | undefined;
}

export type AIOptions = LLMConfig;

export const AIMessageSchema = z.object({
  bot: z.string(),
  options: z.array(z.string()).optional(),
  closed: z.boolean().optional(),
});
