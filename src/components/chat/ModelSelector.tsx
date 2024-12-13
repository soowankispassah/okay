'use client';

import { Fragment, useEffect } from 'react';
import { Listbox, Transition } from '@headlessui/react';
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid';
import { useChatStore } from '@/store/chatStore';
import type { AIModel } from '@/types/chat';

export const models: { id: AIModel; name: string }[] = [
  { id: 'gpt-4o', name: 'gpt-4o' },
  { id: 'gemini-1.5-pro-002', name: 'gemini-1.5-pro-002' },
  { id: 'claude-3-5-sonnet-20240620', name: 'claude-3-5-sonnet-20240620' },
];

interface ModelSelectorProps {
  className?: string;
  buttonClassName?: string;
  optionsClassName?: string;
}

export default function ModelSelector({ 
  className = "w-48", 
  buttonClassName = "relative w-full cursor-default rounded-lg bg-white dark:bg-neutral-800 dark:text-gray-300 py-2 pl-3 pr-10 text-left shadow-md focus:outline-none focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-orange-300 sm:text-sm",
  optionsClassName = "absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white dark:bg-neutral-800 py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm z-10"
}: ModelSelectorProps) {
  const { selectedModel, setModel } = useChatStore();

  // Load saved model on mount
  useEffect(() => {
    const savedModel = localStorage.getItem('selectedModel') as AIModel;
    if (savedModel && models.some(m => m.id === savedModel)) {
      setModel(savedModel);
    }
  }, [setModel]);

  // Save model when it changes
  useEffect(() => {
    localStorage.setItem('selectedModel', selectedModel);
  }, [selectedModel]);

  const selected = models.find((model) => model.id === selectedModel) || models[0];

  return (
    <div className={className}>
      <Listbox value={selected} onChange={(model) => setModel(model.id)}>
        <div className="relative mt-1">
          <Listbox.Button className={buttonClassName}>
            <span className="block truncate">{selected.name}</span>
            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
              <ChevronUpDownIcon
                className="h-5 w-5 text-gray-400 dark:text-gray-500"
                aria-hidden="true"
              />
            </span>
          </Listbox.Button>
          <Transition
            as={Fragment}
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Listbox.Options className={optionsClassName}>
              {models.map((model) => (
                <Listbox.Option
                  key={model.id}
                  className={({ active }) =>
                    `relative cursor-default select-none py-2 pl-10 pr-4 ${
                      active ? 'bg-amber-100 dark:bg-neutral-700 text-amber-900 dark:text-gray-300' : 'text-gray-900 dark:text-gray-300'
                    }`
                  }
                  value={model}
                >
                  {({ selected }) => (
                    <>
                      <span
                        className={`block truncate ${
                          selected ? 'font-medium' : 'font-normal'
                        }`}
                      >
                        {model.name}
                      </span>
                      {selected ? (
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-amber-600 dark:text-amber-500">
                          <CheckIcon className="h-5 w-5" aria-hidden="true" />
                        </span>
                      ) : null}
                    </>
                  )}
                </Listbox.Option>
              ))}
            </Listbox.Options>
          </Transition>
        </div>
      </Listbox>
    </div>
  );
}
