declare module '@google/generative-ai' {
  export interface GenerateContentResult {
    response: {
      text(): string;
    };
  }

  export interface ChatSession {
    sendMessage(message: string): Promise<GenerateContentResult>;
  }

  export interface GenerativeModel {
    generateContent(prompt: string | object): Promise<GenerateContentResult>;
    startChat(config?: object): ChatSession;
  }

  export interface ModelConfig {
    model: string;
    systemInstruction?: string;
  }

  export class GoogleGenerativeAI {
    constructor(apiKey: string);
    getGenerativeModel(config: ModelConfig): GenerativeModel;
  }

  export default GoogleGenerativeAI;
}
