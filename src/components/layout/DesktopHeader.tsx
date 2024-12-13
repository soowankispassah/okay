'use client';
import { GlobeIcon } from '@/components/icons';
import { useLanguage } from '@/hooks/useLanguage';
import UserDropdown from '@/components/shared/UserDropdown';

export default function DesktopHeader() {
  const { selectedLanguage, handleLanguageChange } = useLanguage();

  return (
    <div className="hidden md:flex fixed top-0 right-0 left-[260px] h-16 items-center justify-between px-4 bg-white dark:bg-[#212121] z-30">
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

      <UserDropdown />
    </div>
  );
}