"use client";

import { LogOut } from "lucide-react";

interface LogoutButtonProps {
  onLogout: () => void;
}

export default function LogoutButton({ onLogout }: LogoutButtonProps) {
  return (
    <button
      onClick={onLogout}
      className="w-full bg-red-50 border border-red-200 rounded-xl p-4 flex items-center justify-center space-x-2 hover:bg-red-100 transition-colors"
    >
      <LogOut size={20} className="text-red-600" />
      <span className="text-red-600 font-medium">로그아웃</span>
    </button>
  );
}
