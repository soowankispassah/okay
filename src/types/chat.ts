export type AIModel = 'gpt-4o' | 'gemini-1.5-pro-002' | 'claude-3-5-sonnet-20240620';

export interface Message {
  id: string;
  chatId?: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  model: AIModel;
  images?: string[];
}

export interface ChatState {
  messages: Message[];
  selectedModel: AIModel;
  isStreaming: boolean;
  error: string | null;
}

export interface ActionButton {
  id: string;
  label: string;
  icon: string;
  prompt: string;
}
