'use client';

import { useChatStore } from '@/store/chatStore';
import { UserIcon } from '@heroicons/react/24/solid';
import { ClipboardIcon, ClipboardDocumentCheckIcon } from '@heroicons/react/24/outline';
import { ChatGPTIcon } from '@/components/icons';
import Image from 'next/image';
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';
import { useEffect, useRef, useState } from 'react';
import LoadingDots from './LoadingDots';
import ImagePreview from './ImagePreview';
import { useSession } from 'next-auth/react';

interface ChatMessagesProps {
  chatId: string;
}

export default function ChatMessages({ chatId }: ChatMessagesProps) {
  const { data: session } = useSession();
  const { getMessagesByChatId, isStreaming } = useChatStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [userImage, setUserImage] = useState<string | null>(null);
  const messages = getMessagesByChatId(chatId);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Fetch latest user data
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch('/api/user/get-profile');
        const data = await response.json();
        if (data.user?.image) {
          setUserImage(data.user.image);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchUserData();
  }, []);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400">
        Start a conversation or select a quick action to begin
      </div>
    );
  }

  return (
    <div className="space-y-6 relative z-0">
      {messages.map((message) => (
        <div
          key={message.id}
          className="flex items-start gap-4 py-4"
        >
          {message.role === 'user' ? (
            <>
              <div className="flex-1 overflow-hidden flex flex-col items-end">
                {/* Display images if they exist */}
                {message.images && message.images.length > 0 && (
                  <div className="flex gap-2 mb-2 max-w-[80%]">
                    {message.images.map((imageUrl, index) => (
                      <div key={index} className="relative w-32 h-32 cursor-pointer" onClick={() => setSelectedImage(imageUrl)}>
                        <Image
                          src={imageUrl}
                          alt={`Image ${index + 1}`}
                          fill
                          className="object-cover rounded-lg"
                        />
                      </div>
                    ))}
                  </div>
                )}
                <div className="prose dark:prose-invert inline-block bg-gray-50 dark:bg-[#2f2f2f] px-4 py-2 rounded-lg">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeHighlight, rehypeRaw]}
                    components={{
                      pre({ node, children, ...props }) {
                        const [copied, setCopied] = useState(false);
                        const codeRef = useRef<HTMLPreElement>(null);

                        const handleCopy = async () => {
                          if (!codeRef.current) return;
                          const code = codeRef.current.textContent;
                          if (!code) return;
                          
                          await navigator.clipboard.writeText(code);
                          setCopied(true);
                          setTimeout(() => setCopied(false), 2000);
                        };

                        return (
                          <div className="relative group">
                            <pre ref={codeRef} {...props} className="bg-gray-800 dark:bg-neutral-900 rounded-lg p-4">
                              {children}
                            </pre>
                            <button
                              onClick={handleCopy}
                              className="absolute top-2 right-2 p-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity bg-gray-700 dark:bg-neutral-800 hover:bg-gray-600 dark:hover:bg-neutral-700"
                            >
                              {copied ? (
                                <ClipboardDocumentCheckIcon className="w-5 h-5 text-green-400" />
                              ) : (
                                <ClipboardIcon className="w-5 h-5 text-gray-300" />
                              )}
                            </button>
                          </div>
                        );
                      },
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>
                </div>
              </div>
              <div className="w-7 h-7 rounded-full bg-gray-200 dark:bg-neutral-800 flex items-center justify-center flex-shrink-0 overflow-hidden">
                {userImage ? (
                  <Image
                    src={userImage}
                    alt={session?.user?.email || ''}
                    width={28}
                    height={28}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <UserIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                )}
              </div>
            </>
          ) : (
            <>
              <div className="w-7 h-7 bg-black dark:bg-white rounded-lg flex items-center justify-center">
                <span className="text-white dark:text-black text-lg font-bold">K</span>
              </div>
              <div className="flex-1 space-y-2 overflow-hidden mr-4">
                <div className="prose dark:prose-invert">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeHighlight, rehypeRaw]}
                    components={{
                      pre({ node, children, ...props }) {
                        const [copied, setCopied] = useState(false);
                        const codeRef = useRef<HTMLPreElement>(null);

                        const handleCopy = async () => {
                          if (!codeRef.current) return;
                          const code = codeRef.current.textContent;
                          if (!code) return;
                          
                          await navigator.clipboard.writeText(code);
                          setCopied(true);
                          setTimeout(() => setCopied(false), 2000);
                        };

                        return (
                          <div className="relative group">
                            <pre ref={codeRef} {...props} className="bg-gray-800 dark:bg-neutral-900 rounded-lg p-4">
                              {children}
                            </pre>
                            <button
                              onClick={handleCopy}
                              className="absolute top-2 right-2 p-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity bg-gray-700 dark:bg-neutral-800 hover:bg-gray-600 dark:hover:bg-neutral-700"
                            >
                              {copied ? (
                                <ClipboardDocumentCheckIcon className="w-5 h-5 text-green-400" />
                              ) : (
                                <ClipboardIcon className="w-5 h-5 text-gray-300" />
                              )}
                            </button>
                          </div>
                        );
                      },
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>
                </div>
              </div>
            </>
          )}
        </div>
      ))}

      {/* Loading indicator */}
      {isStreaming && messages.length > 0 && messages[messages.length - 1].role === 'assistant' && (
        <div className="flex gap-4 px-4 py-6">
          <div className="flex-1">
            <LoadingDots />
          </div>
        </div>
      )}

      {/* Scroll anchor */}
      <div ref={messagesEndRef} />

      {/* Image preview modal */}
      {selectedImage && (
        <ImagePreview
          isOpen={true}
          onClose={() => setSelectedImage(null)}
          imageUrl={selectedImage}
        />
      )}
    </div>
  );
}
