"use client";

import { User, Camera } from "lucide-react";
import Image from "next/image";

interface ProfileSectionProps {
  user: {
    name?: string | null;
    image?: string | null;
  } | null;
}

export default function ProfileSection({ user }: ProfileSectionProps) {
  return (
    <div className="bg-white/60 rounded-xl p-4">
      <div className="flex items-center space-x-4">
        <div className="relative">
          {user?.image ? (
            <Image
              src={user.image}
              alt="profile"
              width={60}
              height={60}
              className="rounded-full object-cover aspect-square"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
              <User size={28} className="text-gray-400" />
            </div>
          )}
          <button className="absolute -bottom-1 -right-1 w-6 h-6 bg-white rounded-full shadow-lg flex items-center justify-center border border-gray-200">
            <Camera size={12} className="text-gray-600" />
          </button>
        </div>
        <div className="flex flex-col">
          <span className="font-semibold text-lg">
            {user?.name || "사용자"}
          </span>
        </div>
      </div>
    </div>
  );
}
