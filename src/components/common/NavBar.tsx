'use client';

import { MessageCircle, Calendar, Settings, Sparkles } from 'lucide-react';
import React from 'react';
import { useRouter, usePathname } from 'next/navigation';

const NavBar = () => {
  const router = useRouter();
  const pathname = usePathname();

  const handleTabClick = (tab: string) => {
    switch (tab) {
      case 'chat':
        router.push('/chat');
        break;
      case 'calendar':
        router.push('/calendar');
        break;
      case 'settings':
        router.push('/settings');
        break;
      case 'create-ai':
        router.push('/create-ai');
        break;
      default:
        break;
    }
  };

  const getCurrentTab = () => {
    if (pathname === '/chat') return 'chat';
    if (pathname === '/calendar') return 'calendar';
    if (pathname === '/settings') return 'settings';
    if (pathname === '/create-ai') return 'create-ai';
    return 'chat';
  };

  const currentTab = getCurrentTab();

  return (
    <div className="bg-white/80 backdrop-blur-sm border-t border-stone-200 px-4 py-2 flex-shrink-0">
      <div className="flex justify-around items-center">
        <button
          onClick={() => handleTabClick('chat')}
          className={`flex flex-col items-center space-y-0.5 px-3 py-1.5 rounded-full transition-all duration-200 ${
            currentTab === 'chat'
              ? 'bg-green-100 text-green-600'
              : 'text-gray-500 hover:text-green-500'
          }`}
        >
          <MessageCircle size={20} />
        </button>

        <button
          onClick={() => handleTabClick('calendar')}
          className={`flex flex-col items-center space-y-0.5 px-3 py-1.5 rounded-lg transition-all duration-200 ${
            currentTab === 'calendar'
              ? 'bg-green-100 text-green-600'
              : 'text-gray-500 hover:text-green-500'
          }`}
        >
          <Calendar size={20} />
        </button>

        <button
          onClick={() => handleTabClick('create-ai')}
          className={`flex flex-col items-center space-y-0.5 px-3 py-1.5 rounded-lg transition-all duration-200 ${
            currentTab === 'create-ai'
              ? 'bg-green-100 text-green-600'
              : 'text-gray-500 hover:text-green-500'
          }`}
        >
          <Sparkles size={20} />
        </button>

        <button
          onClick={() => handleTabClick('settings')}
          className={`flex flex-col items-center space-y-0.5 px-3 py-1.5 rounded-lg transition-all duration-200 ${
            currentTab === 'settings'
              ? 'bg-green-100 text-green-600'
              : 'text-gray-500 hover:text-green-500'
          }`}
        >
          <Settings size={20} />
        </button>
      </div>
    </div>
  );
};

export default NavBar;
