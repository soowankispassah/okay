'use client';

import { ImageIcon, LightbulbIcon, SparklesIcon, ChartIcon, ImageSearchIcon } from '../icons';
import { useRouter } from 'next/navigation';
import { useChatStore } from '@/store/chatStore';
import { v4 as uuidv4 } from 'uuid';

const quickActions = [
  {
    id: 'create-image',
    icon: <ImageIcon className="w-4 h-4" />,
    label: 'Create image',
    prompt: 'Create a detailed image of',
  },
  {
    id: 'get-advice',
    icon: <LightbulbIcon className="w-4 h-4" />,
    label: 'Get advice',
    prompt: 'I need advice about',
  },
  {
    id: 'surprise-me',
    icon: <SparklesIcon className="w-4 h-4" />,
    label: 'Surprise me',
    prompt: 'Tell me something interesting about',
  },
  {
    id: 'analyze-data',
    icon: <ChartIcon className="w-4 h-4" />,
    label: 'Analyze data',
    prompt: 'Analyze this data:',
  },
  {
    id: 'analyze-images',
    icon: <ImageSearchIcon className="w-4 h-4" />,
    label: 'Analyze images',
    prompt: 'Analyze this image:',
  },
] as const;

export default function ActionButtons() {
  const router = useRouter();
  const { addMessage, selectedModel } = useChatStore();

  const handleAction = (prompt: string) => {
    const message = {
      id: uuidv4(),
      role: 'user' as const,
      content: prompt,
      timestamp: Date.now(),
      model: selectedModel,
    };
    addMessage(message);
    router.push('/chat');
  };

  return (
    <div className="flex flex-wrap justify-center gap-2 px-4">
      {quickActions.map((action) => (
        <ActionButton
          key={action.id}
          icon={action.icon}
          label={action.label}
          onClick={() => handleAction(action.prompt)}
        />
      ))}
      <ActionButton label="More" onClick={() => router.push('/chat')} />
    </div>
  );
}

interface ActionButtonProps {
  icon?: React.ReactNode;
  label: string;
  onClick?: () => void;
}

function ActionButton({ icon, label, onClick }: ActionButtonProps) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-4 py-2.5 text-sm rounded-xl hover:bg-gray-50 dark:hover:bg-neutral-800 border border-gray-200 dark:border-neutral-800 dark:text-gray-300 transition-colors"
    >
      {icon}
      {label}
    </button>
  );
}