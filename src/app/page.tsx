'use client';

import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import AppLayout from '@/components/layout/AppLayout';
import ChatInput from '@/components/chat/ChatInput';
import ActionButtons from '@/components/chat/ActionButtons';
import ModelSelector from '@/components/chat/ModelSelector';
import { useChatStore } from '@/store/chatStore';
import { v4 as uuidv4 } from 'uuid';

export default function Home() {
  const router = useRouter();
  const { data: session } = useSession();
  const { addMessage, selectedModel, setStreaming, setError, updateMessage } = useChatStore();

  const handleSubmit = async (message: string, files?: File[]) => {
    if (!message.trim() && (!files || files.length === 0)) return;

    const chatId = uuidv4();
    
    // Convert files to base64 if they exist
    const imageAttachments = files ? await Promise.all(
      files.map(async (file) => {
        const reader = new FileReader();
        return new Promise<string>((resolve) => {
          reader.onloadend = () => {
            resolve(reader.result as string);
          };
          reader.readAsDataURL(file);
        });
      })
    ) : [];

    // Add user message
    const userMessage = {
      id: uuidv4(),
      chatId,
      role: 'user' as const,
      content: message,
      timestamp: Date.now(),
      model: selectedModel,
      images: imageAttachments,
    };

    addMessage(userMessage);

    // Navigate to chat page immediately
    router.push(`/chat/${chatId}`);

    try {
      setStreaming(true);

      // Get the current language from localStorage
      const selectedLanguage = localStorage.getItem('selectedLanguage') || 'en';

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

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [userMessage],
          model: selectedModel,
          language: selectedLanguage,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to get response');
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response reader');

      let accumulatedContent = '';
      
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          // Convert the chunk to text
          const chunk = new TextDecoder().decode(value);
          const lines = chunk.split('\n');

          // Process each line
          for (const line of lines) {
            if (line.trim() === '') continue;
            
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.content) {
                  accumulatedContent += data.content;
                  updateMessage(assistantMessage.id, accumulatedContent);
                }
              } catch (e) {
                console.error('Error parsing SSE data:', e);
                continue;
              }
            }
          }
        }
      } catch (streamError) {
        console.error('Stream processing error:', streamError);
        throw streamError;
      } finally {
        reader.releaseLock();
      }
    } catch (error) {
      console.error('Error in chat:', error);
      setError(error instanceof Error ? error.message : 'Failed to get response');
    } finally {
      setStreaming(false);
    }
  };

  // Get the user's first name
  const firstName = session?.user?.name?.split(' ')[0] || '';

  return (
    <AppLayout>
      <main className="flex-1 flex flex-col items-center justify-center bg-white dark:bg-[#212121]">
        <h1 className="text-4xl font-semibold mb-8 dark:text-white">
          What can I help with?
        </h1>
        <div className="w-full max-w-2xl px-4 space-y-4">
          <ModelSelector className="mx-auto" />
          <ChatInput onSubmit={handleSubmit} />
          <ActionButtons />
        </div>
      </main>
      <footer className="text-center p-4 text-sm text-gray-500 bg-white dark:bg-[#212121]">
        Powered by <a href="#" className="font-bold">OlenkaAI</a>.
      </footer>
    </AppLayout>
  );
}
