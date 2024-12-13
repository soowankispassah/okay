'use client';

import { useState } from 'react';
import Sidebar from './Sidebar';
import MobileHeader from './MobileHeader';
import DesktopHeader from './DesktopHeader';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-[#1a1a1a]">
      {/* Mobile header - visible on mobile only */}
      <MobileHeader onMenuClick={() => setIsSidebarOpen(true)} />
      
      {/* Desktop header - visible on desktop only */}
      <DesktopHeader />
      
      {/* Sidebar */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      
      {/* Main content */}
      <main className="flex-1 flex flex-col md:pl-[260px] pt-[64px] overflow-auto">
        {children}
      </main>
    </div>
  );
} 