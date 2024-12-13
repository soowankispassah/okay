'use client';

import { MenuIcon, GlobeIcon } from '@/components/icons';
import UserDropdown from '@/components/shared/UserDropdown';
import { useLanguage } from '@/hooks/useLanguage';

interface MobileHeaderProps {
  onMenuClick: () => void;
}

export default function MobileHeader({ onMenuClick }: MobileHeaderProps) {
  const { selectedLanguage, handleLanguageChange } = useLanguage();

  return (
    <div className="md:hidden fixed top-0 left-0 right-0 h-16 flex items-center justify-between px-4 bg-white dark:bg-[#212121] z-30">
      <button
        onClick={onMenuClick}
        className="p-2 rounded-md text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
      >
        <MenuIcon className="h-6 w-6" />
      </button>

      <div className="flex items-center gap-2">
        <GlobeIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
        <select 
          value={selectedLanguage}
          onChange={handleLanguageChange}
          className="text-sm font-medium bg-transparent border-none focus:ring-0 text-gray-700 dark:text-gray-300"
        >
          <option value="english" className="dark:bg-[#212121] dark:text-gray-300">English</option>
          <option value="khasi" className="dark:bg-[#212121] dark:text-gray-300">Khasi</option>
          <option value="hindi" className="dark:bg-[#212121] dark:text-gray-300">Hindi</option>
        </select>
      </div>

      <div className="flex items-center">
        <UserDropdown />
      </div>
    </div>
  );
}