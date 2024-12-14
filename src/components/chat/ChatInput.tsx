'use client';

import { useState, useRef, useEffect } from 'react';
import { useChatStore } from '@/store/chatStore';
import { AttachmentIcon, SendIcon } from '@/components/icons';
import Image from 'next/image';

interface ChatInputProps {
  onSubmit?: (message: string, files?: File[]) => void;
}

export default function ChatInput({ onSubmit }: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { isStreaming } = useChatStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() && previewUrls.length === 0) return;

    onSubmit?.(message, fileInputRef.current?.files ? Array.from(fileInputRef.current.files) : undefined);
    setMessage('');
    setPreviewUrls([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrls(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      {previewUrls.length > 0 && (
        <div className="flex gap-2 mb-2 overflow-x-auto p-2">
          {previewUrls.map((url, index) => (
            <div key={url} className="relative w-16 h-16 flex-shrink-0">
              <Image
                src={url}
                alt={`Preview ${index + 1}`}
                fill
                className="rounded-lg object-cover"
              />
              <button
                type="button"
                disabled={isStreaming}
                onClick={() => {
                  setPreviewUrls(prev => prev.filter(u => u !== url));
                  if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                  }
                }}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs disabled:opacity-50"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="relative">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Send a message"
          className="w-full p-4 pr-24 rounded-xl border border-gray-300 dark:border-neutral-800 dark:bg-[#2f2f2f] dark:text-gray-100 shadow-sm focus:border-gray-400 focus:ring-0"
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            multiple
            onChange={handleFileChange}
            disabled={isStreaming}
          />
          <button
            type="button"
            onClick={handleFileClick}
            disabled={isStreaming}
            className="p-2 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg disabled:opacity-50 disabled:hover:bg-transparent"
          >
            <AttachmentIcon className="w-5 h-5 text-gray-400" />
          </button>
          <button
            type="submit"
            disabled={isStreaming || (!message.trim() && previewUrls.length === 0)}
            className={`p-2 rounded-lg transition-colors ${
              isStreaming || (!message.trim() && previewUrls.length === 0)
                ? 'opacity-50 cursor-not-allowed bg-gray-100 dark:bg-neutral-800'
                : 'hover:bg-gray-100 dark:hover:bg-neutral-800'
            }`}
          >
            <SendIcon className={`w-5 h-5 ${isStreaming ? 'text-gray-400' : 'text-gray-400'}`} />
          </button>
        </div>
      </div>
    </form>
  );
}