'use client';
import { useState } from 'react';
import Sidebar from './Sidebar';
import MobileHeader from './MobileHeader';
import DesktopHeader from './DesktopHeader';

export default function Layout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-white dark:bg-[#1a1a1a]">
      <MobileHeader onMenuClick={() => setIsSidebarOpen(true)} />
      <DesktopHeader />
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <div className="flex-1 flex flex-col md:pl-[260px] pt-[56px]">
        {children}
      </div>
    </div>
  );
}