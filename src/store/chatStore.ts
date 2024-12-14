import { create } from 'zustand';
import { Message, AIModel } from '@/types/chat';

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
  addMessage: (message: Message & { chatId: string }) => void;
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
  setSelectedChatId: (chatId: string | null) => void;
}

const initialState: Omit<ChatStore, 'addMessage' | 'updateMessage' | 'setModel' | 'setStreaming' | 'setError' | 'clearMessages' | 'getMessagesByChatId' | 'getChatTitle' | 'initializeSession' | 'deleteChat' | 'updateChatTitle' | 'setSelectedChatId'> = {
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
      const messageWithTimestamp = {
        ...message,
        timestamp,
      };

      const newMessages = [...state.messages, messageWithTimestamp];
      const newMessagesByChatId = {
        ...state.messagesByChatId,
        [message.chatId]: [...(state.messagesByChatId[message.chatId] || []), messageWithTimestamp],
      };

      const newChatTitles = { ...state.chatTitles };
      if (!state.messagesByChatId[message.chatId] && message.role === 'user') {
        newChatTitles[message.chatId] = message.content;
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
  setStreaming: (isStreaming) => {
    set({ isStreaming });
    
    if (!isStreaming) {
      const state = get();
      const messages = state.messages;
      const lastMessage = messages[messages.length - 1];
      
      if (lastMessage && lastMessage.role === 'assistant') {
        fetch('/api/chat/save', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ message: lastMessage }),
        }).catch(error => {
          console.error('Error saving message:', error);
        });
      }
    }
  },
  setModel: (model) => {
    set({ selectedModel: model });
  },
  setError: (error) => set({ error }),
  clearMessages: () => set({ messages: [], messagesByChatId: {} }),
  getMessagesByChatId: (chatId: string) => {
    return get().messagesByChatId[chatId] || [];
  },
  getChatTitle: (chatId: string) => {
    return get().chatTitles[chatId] || 'New Chat';
  },
  setSelectedChatId: (chatId: string | null) => {
    set({ selectedChatId: chatId });
  },
  initializeSession: async () => {
    const state = get();
    if (state.isInitialized || state.isInitializing) {
      return;
    }

    try {
      set({ isInitializing: true, error: null });

      const response = await fetch('/api/chat/history');
      if (!response.ok) {
        throw new Error('Failed to load chat history');
      }

      const data = await response.json();

      if (data.success && data.chats) {
        const messagesByChatId: Record<string, Message[]> = {};
        const chatTitles: Record<string, string> = {};
        
        ['today', 'yesterday', 'previous7Days', 'older'].forEach(group => {
          if (data.chats[group]) {
            data.chats[group].forEach((chat: any) => {
              if (chat.messages && chat.messages.length > 0) {
                messagesByChatId[chat.id] = chat.messages.map((msg: any) => ({
                  ...msg,
                  timestamp: new Date(msg.timestamp).getTime()
                }));
                
                chatTitles[chat.id] = chat.title || messagesByChatId[chat.id][0]?.content?.slice(0, 100) || 'New Chat';
              }
            });
          }
        });

        set({
          messagesByChatId,
          chatTitles,
          isInitialized: true,
          isInitializing: false,
          error: null
        });
      }
    } catch (error) {
      console.error('Error initializing session:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to load chat history',
        isInitializing: false 
      });
    }
  },
  deleteChat: async (chatId: string) => {
    try {
      const response = await fetch(`/api/chat/${chatId}/delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete chat');
      }

      const data = await response.json();
      if (data.success) {
        set((state) => {
          const newMessagesByChatId = { ...state.messagesByChatId };
          const newChatTitles = { ...state.chatTitles };
          delete newMessagesByChatId[chatId];
          delete newChatTitles[chatId];
          return {
            messagesByChatId: newMessagesByChatId,
            chatTitles: newChatTitles,
            selectedChatId: state.selectedChatId === chatId ? null : state.selectedChatId
          };
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error deleting chat:', error);
      return false;
    }
  },
  updateChatTitle: async (chatId: string, title: string) => {
    try {
      const response = await fetch(`/api/chat/${chatId}/update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title }),
      });

      if (!response.ok) {
        throw new Error('Failed to update chat title');
      }

      const data = await response.json();
      if (data.success) {
        set((state) => ({
          chatTitles: {
            ...state.chatTitles,
            [chatId]: title
          }
        }));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error updating chat title:', error);
      return false;
    }
  }
}));
