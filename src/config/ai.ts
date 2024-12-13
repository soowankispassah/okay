import { AIModel } from '@/types/chat';

export const AI_MODELS: Record<AIModel, {
  name: string;
  description: string;
  provider: 'openai' | 'google' | 'anthropic';
  maxTokens?: number;
  inputTokenMultiplier: number;
}> = {
  'gpt-4o': {
    name: 'gpt-4o',
    description: 'Most capable GPT-4 model, can understand images',
    provider: 'openai',
    maxTokens: 4096,
    inputTokenMultiplier: 1,
  },
  'gemini-1.5-pro-002': {
    name: 'gemini-1.5-pro-002',
    description: 'Most capable Gemini model, can understand images',
    provider: 'google',
    maxTokens: 4096,
    inputTokenMultiplier: 1,
  },
  'claude-3-5-sonnet-20240620': {
    name: 'claude-3-5-sonnet-20240620',
    description: 'Most capable Claude model',
    provider: 'anthropic',
    maxTokens: 4096,
    inputTokenMultiplier: 1,
  },
};
