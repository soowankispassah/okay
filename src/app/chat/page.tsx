'use client';

import Layout from '@/components/layout/Layout';
import ChatInput from '@/components/chat/ChatInput';
import ModelSelector from '@/components/chat/ModelSelector';
import ChatMessages from '@/components/chat/ChatMessages';
import { useChatStore } from '@/store/chatStore';

export default function ChatPage() {
  const { messages } = useChatStore();

  return (
    <Layout>
      <div className="flex-1 flex flex-col max-w-5xl mx-auto w-full">
        <div className="p-4 border-b">
          <ModelSelector />
        </div>
        <div className="flex-1 overflow-auto p-4">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              Start a conversation by selecting a model and typing a message
            </div>
          ) : (
            <ChatMessages />
          )}
        </div>
        <div className="p-4">
          <ChatInput />
        </div>
      </div>
    </Layout>
  );
}