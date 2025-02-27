import { LLMConfig } from "../../domain/types/LLMConfig";

export interface APIGateway {
  getSettings(): Promise<GeneralSettings>;
  updateSetting(key: string, value: any): Promise<void>;
  getSetting<T>(key: string, defaultValue: T): Promise<T>;
}

export type GeneralSettings = {
  system_prompt: string;
  session_duration: number;
  llm_config: LLMConfig;
};
