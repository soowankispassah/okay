'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ChatIcon } from '@/components/icons';
import { useEffect, useState, useRef } from 'react';
import { useChatStore } from '@/store/chatStore';
import { Menu } from '@headlessui/react';
import { EllipsisVerticalIcon } from '@heroicons/react/24/outline';
import { TrashIcon, PencilIcon } from '@heroicons/react/24/outline';
import DeleteChatModal from '@/components/modals/DeleteChatModal';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const { initializeSession, messagesByChatId, deleteChat, updateChatTitle, getChatTitle } = useChatStore();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const editInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    initializeSession();
  }, [initializeSession]);

  useEffect(() => {
    if (editingChatId && editInputRef.current) {
      editInputRef.current.focus();
      const length = editInputRef.current.value.length;
      editInputRef.current.setSelectionRange(length, length);
    }
  }, [editingChatId]);

  const handleStartEditing = (chatId: string, title: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingChatId(chatId);
    setEditingTitle(title);
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditingTitle(e.target.value);
  };

  const handleSaveTitle = async () => {
    if (!editingChatId || !editingTitle.trim()) return;
    
    await updateChatTitle(editingChatId, editingTitle.trim());
    setEditingChatId(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSaveTitle();
    } else if (e.key === 'Escape') {
      setEditingChatId(null);
    }
  };

  const handleDelete = async (chatId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedChatId(chatId);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedChatId) return;
    
    setIsDeleting(true);
    if (await deleteChat(selectedChatId)) {
      if (pathname === `/chat/${selectedChatId}`) {
        router.push('/');
      }
    }
    setIsDeleting(false);
    setIsDeleteModalOpen(false);
    setSelectedChatId(null);
  };

  const groupChatsByDate = () => {
    const chats = Object.entries(messagesByChatId)
      .map(([id, messages]) => ({
        id,
        title: getChatTitle(id),
        updatedAt: messages[messages.length - 1]?.timestamp || Date.now(),
        createdAt: messages[0]?.timestamp || Date.now()
      }))
      .sort((a, b) => {
        const updateDiff = b.updatedAt - a.updatedAt;
        if (updateDiff !== 0) return updateDiff;
        return b.createdAt - a.createdAt;
      });

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    return {
      today: chats.filter(chat => {
        const chatDate = new Date(chat.updatedAt);
        return chatDate >= today;
      }),
      yesterday: chats.filter(chat => {
        const chatDate = new Date(chat.updatedAt);
        return chatDate >= yesterday && chatDate < today;
      }),
      previous7Days: chats.filter(chat => {
        const chatDate = new Date(chat.updatedAt);
        return chatDate >= weekAgo && chatDate < yesterday;
      }),
      older: chats.filter(chat => {
        const chatDate = new Date(chat.updatedAt);
        return chatDate < weekAgo;
      })
    };
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 md:hidden z-40"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full w-[260px] bg-[#f9f9f9] dark:bg-[#171717] z-50 transform transition-transform duration-200 ease-in-out flex flex-col
          ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}
      >
        {/* Logo */}
        <div className="flex-none h-16 flex items-center px-4">
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-black dark:bg-white rounded-lg flex items-center justify-center">
              <span className="text-white dark:text-black text-xl font-bold">K</span>
            </div>
            <span className="text-xl font-semibold text-gray-900 dark:text-white">KhasiGPT</span>
          </Link>
        </div>

        {/* New Chat Link */}
        <div className="flex-none p-2">
          <Link
            href="/"
            className="group flex items-center px-3 py-2 text-sm font-medium rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <ChatIcon className="mr-3 h-5 w-5 text-gray-500 dark:text-gray-400" />
            New Chat
          </Link>
        </div>

        {/* Chat History - Scrollable */}
        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-track-gray-100 dark:scrollbar-track-neutral-800 scrollbar-thumb-gray-300 dark:scrollbar-thumb-neutral-600 hover:scrollbar-thumb-gray-400 dark:hover:scrollbar-thumb-neutral-500">
          <div className="py-4 px-2">
            {Object.entries(groupChatsByDate()).map(([date, chats]) => (
              chats.length > 0 ? (
                <div key={date}>
                  <h3 className="px-3 mb-2 text-xs font-medium text-gray-500 dark:text-gray-400">
                    {date}
                  </h3>
                  {chats.map((chat) => (
                    <Link
                      key={chat.id}
                      href={`/chat/${chat.id}`}
                      className={`block px-3 py-0.5 text-sm rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 group ${
                        pathname === `/chat/${chat.id}` ? 'bg-gray-100 dark:bg-gray-800' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        {editingChatId === chat.id ? (
                          <input
                            ref={editInputRef}
                            type="text"
                            value={editingTitle}
                            onChange={handleTitleChange}
                            onBlur={handleSaveTitle}
                            onKeyDown={handleKeyDown}
                            className="flex-1 bg-gray-100 dark:bg-neutral-800/70 border-none focus:outline-none focus:ring-2 focus:ring-blue-500/30 dark:focus:ring-blue-500/20 rounded px-1.5 -mx-1.5 text-sm text-gray-700 dark:text-gray-300"
                            placeholder="Chat title"
                          />
                        ) : (
                          <div className="whitespace-nowrap overflow-hidden text-ellipsis">{chat.title}</div>
                        )}
                        <Menu as="div" className="relative">
                          {({ open, close }) => (
                            <>
                              <div className={`${pathname === `/chat/${chat.id}` ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}>
                                <Menu.Button className="p-1 rounded-md text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                                  <EllipsisVerticalIcon className="w-5 h-5" />
                                </Menu.Button>
                              </div>
                              {open && (
                                <Menu.Items className="absolute right-0 mt-1 w-48 bg-white dark:bg-neutral-800 rounded-md shadow-lg border border-gray-200 dark:border-neutral-700 focus:outline-none z-50">
                                  <Menu.Item>
                                    {({ active }) => (
                                      <button
                                        className={`${
                                          active ? 'bg-gray-100 dark:bg-neutral-700' : ''
                                        } flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200`}
                                        onClick={(e) => {
                                          handleStartEditing(chat.id, chat.title, e);
                                          close();
                                        }}
                                      >
                                        <PencilIcon className="w-4 h-4 mr-3" />
                                        Rename
                                      </button>
                                    )}
                                  </Menu.Item>
                                  <Menu.Item>
                                    {({ active }) => (
                                      <button
                                        className={`${
                                          active ? 'bg-gray-100 dark:bg-neutral-700' : ''
                                        } flex items-center w-full px-4 py-2 text-sm text-red-600 dark:text-red-400`}
                                        onClick={(e) => handleDelete(chat.id, e)}
                                      >
                                        <TrashIcon className="w-4 h-4 mr-3" />
                                        Delete
                                      </button>
                                    )}
                                  </Menu.Item>
                                </Menu.Items>
                              )}
                            </>
                          )}
                        </Menu>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : null
            ))}
          </div>
        </div>
      </div>

      {/* Delete Chat Modal */}
      <DeleteChatModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedChatId(null);
        }}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
      />
    </>
  );
}