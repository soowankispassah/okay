import { create } from 'zustand';
import { Message, AIModel } from '@/types/chat';
import { v4 as uuidv4 } from 'uuid';

interface ChatStore {
  messages: Message[];
  messagesByChatId: Record<string, Message[]>;
  chatTitles: Record<string, string>;
  chats: [];
  selectedChatId: string | null;
  selectedModel: AIModel;
  isStreaming: boolean;
  error: string | null;
  isInitialized: boolean;
  isInitializing: boolean;
  addMessage: (message: Message) => void;
  updateMessage: (messageId: string, content: string) => void;
  setModel: (model: AIModel) => void;
  setStreaming: (isStreaming: boolean) => void;
  setError: (error: string | null) => void;
  clearMessages: () => void;
  getMessagesByChatId: (chatId: string) => Message[];
  getChatTitle: (chatId: string) => string;
  initializeSession: () => Promise<void>;
  deleteChat: (chatId: string) => Promise<boolean>;
  updateChatTitle: (chatId: string, title: string) => Promise<boolean>;
}

const initialState: Omit<ChatStore, 'addMessage' | 'updateMessage' | 'setModel' | 'setStreaming' | 'setError' | 'clearMessages' | 'getMessagesByChatId' | 'getChatTitle' | 'initializeSession' | 'deleteChat' | 'updateChatTitle'> = {
  messages: [],
  messagesByChatId: {},
  chatTitles: {},
  chats: [],
  selectedChatId: null,
  selectedModel: 'gpt-4o',
  isStreaming: false,
  error: null,
  isInitialized: false,
  isInitializing: false,
};

export const useChatStore = create<ChatStore>((set, get) => ({
  ...initialState,
  addMessage: (message) => {
    set((state) => {
      const timestamp = Date.now();
      const chatId = message.chatId || uuidv4();
      const messageWithTimestamp = {
        ...message,
        chatId,
        timestamp,
      };

      const newMessages = [...state.messages, messageWithTimestamp];
      const newMessagesByChatId = {
        ...state.messagesByChatId,
        [chatId]: [...(state.messagesByChatId[chatId] || []), messageWithTimestamp],
      };

      const newChatTitles = { ...state.chatTitles };
      if (!state.messagesByChatId[chatId] && message.role === 'user') {
        newChatTitles[chatId] = message.content;
      }

      if (message.role === 'user') {
        fetch('/api/chat/save', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ message: messageWithTimestamp }),
        }).catch(error => {
          console.error('Error saving message:', error);
        });
      }

      return {
        messages: newMessages,
        messagesByChatId: newMessagesByChatId,
        chatTitles: newChatTitles,
      };
    });
  },
  updateMessage: (messageId, content) =>
    set((state) => {
      const newMessages = state.messages.map((message) =>
        message.id === messageId ? { ...message, content } : message
      );
      
      const newMessagesByChatId = { ...state.messagesByChatId };
      Object.keys(newMessagesByChatId).forEach((chatId) => {
        newMessagesByChatId[chatId] = newMessagesByChatId[chatId].map((message) => {
          if (message.id === messageId) {
            const updatedMessage = { ...message, content };
            return updatedMessage;
          }
          return message;
        });
      });
      
      return {
        messages: newMessages,
        messagesByChatId: newMessagesByChatId,
      };
    }),
  setModel: (model) => set({ selectedModel: model }),
  setStreaming: (isStreaming) => set({ isStreaming }),
  setError: (error) => set({ error }),
  clearMessages: () => set({ messages: [], messagesByChatId: {} }),
  getMessagesByChatId: (chatId) => {
    const state = get();
    return state.messagesByChatId[chatId] || [];
  },
  getChatTitle: (chatId) => {
    const state = get();
    return state.chatTitles[chatId] || '';
  },
  initializeSession: async () => {
    const state = get();
    if (state.isInitialized || state.isInitializing) return;

    set({ isInitializing: true });

    try {
      // Initialize session logic here
      set({ isInitialized: true });
    } catch (error) {
      console.error('Failed to initialize session:', error);
    } finally {
      set({ isInitializing: false });
    }
  },
  deleteChat: async (chatId) => {
    try {
      // Delete chat logic here
      return true;
    } catch (error) {
      console.error('Failed to delete chat:', error);
      return false;
    }
  },
  updateChatTitle: async (chatId, title) => {
    try {
      set((state) => ({
        chatTitles: {
          ...state.chatTitles,
          [chatId]: title,
        },
      }));
      return true;
    } catch (error) {
      console.error('Failed to update chat title:', error);
      return false;
    }
  },
}));
