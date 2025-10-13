"use client";

import { Bell, Shield, HelpCircle } from "lucide-react";

export default function SettingsOptions() {
  return (
    <div className="space-y-2">
      <button className="w-full bg-white/60 rounded-xl p-4 flex items-center justify-between hover:bg-white/80 transition-colors">
        <div className="flex items-center space-x-3">
          <Bell size={20} className="text-gray-600" />
          <span className="text-gray-800">알림 설정</span>
        </div>
        <span className="text-gray-400">›</span>
      </button>

      <button className="w-full bg-white/60 rounded-xl p-4 flex items-center justify-between hover:bg-white/80 transition-colors">
        <div className="flex items-center space-x-3">
          <Shield size={20} className="text-gray-600" />
          <span className="text-gray-800">개인정보 보호</span>
        </div>
        <span className="text-gray-400">›</span>
      </button>

      <button className="w-full bg-white/60 rounded-xl p-4 flex items-center justify-between hover:bg-white/80 transition-colors">
        <div className="flex items-center space-x-3">
          <HelpCircle size={20} className="text-gray-600" />
          <span className="text-gray-800">도움말</span>
        </div>
        <span className="text-gray-400">›</span>
      </button>
    </div>
  );
}
