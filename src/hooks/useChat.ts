import { useState, useCallback, useRef } from 'react';
import { useChatStore } from '@/store/chatStore';
import { v4 as uuidv4 } from 'uuid';

export function useChat() {
  const { addMessage, selectedModel, setStreaming } = useChatStore();
  const [error, setError] = useState<string | null>(null);
  const abortController = useRef<AbortController | null>(null);
  const chatId = useRef(uuidv4()).current;

  const sendMessage = useCallback(async (content: string, images?: string[]) => {
    try {
      // Abort previous request if exists
      if (abortController.current) {
        abortController.current.abort();
      }

      // Create new abort controller
      abortController.current = new AbortController();

      // Add user message
      const userMessage = {
        id: uuidv4(),
        chatId,
        role: 'user' as const,
        content,
        timestamp: Date.now(),
        model: selectedModel,
        images,
      };
      addMessage(userMessage);

      // Prepare AI message
      const aiMessageId = uuidv4();
      addMessage({
        id: aiMessageId,
        chatId,
        role: 'assistant',
        content: '',
        timestamp: Date.now(),
        model: selectedModel,
      });

      setStreaming(true);
      setError(null);

      // Send request to API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [userMessage],
          model: selectedModel,
        }),
        signal: abortController.current.signal,
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      if (!response.body) {
        throw new Error('No response body');
      }

      // Process the stream
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              accumulatedContent += data.content;
              addMessage({
                id: aiMessageId,
                chatId,
                role: 'assistant',
                content: accumulatedContent,
                timestamp: Date.now(),
                model: selectedModel,
              });
            } catch (e) {
              console.error('Error parsing SSE data:', e);
            }
          }
        }
      }
    } catch (err) {
      if (err instanceof Error) {
        if (err.name === 'AbortError') {
          console.log('Request aborted');
        } else {
          setError(err.message);
        }
      }
    } finally {
      setStreaming(false);
      abortController.current = null;
    }
  }, [addMessage, selectedModel, setStreaming, chatId]);

  const cancelRequest = useCallback(() => {
    if (abortController.current) {
      abortController.current.abort();
    }
  }, []);

  return {
    sendMessage,
    cancelRequest,
    error,
  };
}
