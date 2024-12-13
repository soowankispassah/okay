'use client';

import { useParams, useRouter } from 'next/navigation';
import Layout from '@/components/layout/Layout';
import ChatInput from '@/components/chat/ChatInput';
import ChatMessages from '@/components/chat/ChatMessages';
import ModelSelector from '@/components/chat/ModelSelector';
import { useChatStore } from '@/store/chatStore';
import { ExclamationCircleIcon } from '@heroicons/react/24/outline';
import { v4 as uuidv4 } from 'uuid';
import { useState, useCallback, useEffect } from 'react';

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const chatId = params.id as string;
  const { addMessage, selectedModel, getMessagesByChatId, setStreaming, setError, updateMessage, error, initializeSession } = useChatStore();
  const [lastMessage, setLastMessage] = useState('');

  useEffect(() => {
    // Initialize session only once when the component mounts
    initializeSession();
  }, [initializeSession]);

  const processImages = useCallback(async (files: File[]) => {
    return Promise.all(
      files.map(async (file) => {
        return new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
      })
    );
  }, []);

  const handleSubmit = async (message: string, files?: File[]) => {
    if (!message.trim() && (!files || files.length === 0)) return;

    try {
      setStreaming(true);
      setError(null);
      setLastMessage(message);

      const selectedLanguage = localStorage.getItem('selectedLanguage') || 'en';
      
      // Create user message
      const userMessage = {
        id: uuidv4(),
        role: 'user' as const,
        content: message,
        chatId,
        timestamp: Date.now(),
        model: selectedModel,
        images: [] as string[],
      };

      // Process images first if they exist
      if (files && files.length > 0) {
        const imageAttachments = await processImages(files);
        userMessage.images = imageAttachments;
      }

      // Add user message with complete data
      addMessage(userMessage);

      // Create assistant message placeholder
      const assistantMessage = {
        id: uuidv4(),
        chatId,
        role: 'assistant' as const,
        content: '',
        timestamp: Date.now(),
        model: selectedModel,
      };
      addMessage(assistantMessage);

      // Get chat history
      const chatHistory = getMessagesByChatId(chatId)
        .filter(m => m.content.trim() !== '' || (m.images && m.images.length > 0))
        .map(m => ({
          role: m.role,
          content: m.content,
          images: m.images,
        }));

      // Make API request in background
      fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: chatHistory,
          model: selectedModel,
          language: selectedLanguage,
        }),
      }).then(async (response) => {
        if (!response.ok) {
          const error = await response.json();
          setError(error.error);
          return;
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error('No response reader');

        let accumulatedContent = '';
        const decoder = new TextDecoder();
        
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');

            for (const line of lines) {
              if (line.trim() === '' || !line.startsWith('data: ')) continue;
              
              try {
                const data = JSON.parse(line.slice(6));
                if (data.content) {
                  accumulatedContent += data.content;
                  updateMessage(assistantMessage.id, accumulatedContent);
                }
              } catch (e) {
                console.error('Error parsing SSE data:', e);
              }
            }
          }
        } finally {
          reader.releaseLock();
          setStreaming(false);
        }
      }).catch((error) => {
        console.error('Chat error:', error);
        setError(error.message || 'An error occurred during chat');
        setStreaming(false);
      });

    } catch (error: any) {
      console.error('Chat error:', error);
      setError(error.message || 'An error occurred during chat');
      setStreaming(false);
    }
  };

  return (
    <Layout>
      <div className="flex flex-col h-full bg-white dark:bg-[#212121]">
        <div className="px-4 py-2 max-w-[48rem] mx-auto w-full">
          <ModelSelector />
        </div>
        <div className="flex-1 overflow-y-auto pb-36 pt-10 px-4">
          <div className="max-w-[48rem] mx-auto">
            <ChatMessages chatId={chatId} />
          </div>
        </div>
        <div className="fixed bottom-0 right-0 bg-white dark:bg-[#212121] border-gray-200 dark:border-neutral-800 p-4 z-50 md:left-[260px] left-0">
          <div className="max-w-[48rem] mx-auto">
            {error && (
              <div className="mb-4 flex justify-center">
                <div className="inline-flex items-center gap-3 p-3 bg-red-50 dark:bg-red-900/50 text-red-500 dark:text-red-300 rounded-lg">
                  <ExclamationCircleIcon className="w-5 h-5" />
                  {error}
                </div>
              </div>
            )}
            <ChatInput onSubmit={handleSubmit} />
          </div>
        </div>
      </div>
    </Layout>
  );
}
