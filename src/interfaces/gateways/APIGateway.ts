export interface APIGateway {
  getSettings(): Promise<GeneralSettings>;
}

export type GeneralSettings = {
  system_prompt: string;
  session_duration: number;
};
