"use client";

import { useState, useEffect } from "react";
import type { AIPersonality } from "@/lib/ai-personalities";
import { getPersonalityByIdAsync } from "@/lib/ai-personalities";
import PersonalitySelector from "./components/PersonalitySelector";
import ProfileSection from "./components/ProfileSection";
import AIPersonalitySection from "./components/AIPersonalitySection";
import SettingsOptions from "./components/SettingsOptions";
import AppInfo from "./components/AppInfo";
import LogoutButton from "./components/LogoutButton";
import { signOut } from "next-auth/react";
import useUserStore from "@/store/userStore";

export default function SettingsPage() {
  const [showPersonalitySelector, setShowPersonalitySelector] = useState(false);
  const {
    user,
    selectedPersonalityId,
    selectedPersonality: storedPersonality,
    saveSelectedPersonalityId,
    setSelectedPersonality,
    loadUserData,
    clearUser,
  } = useUserStore();

  useEffect(() => {
    // 컴포넌트 마운트 시 사용자 데이터 불러오기
    loadUserData();
  }, [loadUserData]);

  // 선택된 성격 로드 (커스텀 AI 포함)
  useEffect(() => {
    const loadSelectedPersonality = async () => {
      if (!selectedPersonalityId) return;
      // ID가 바뀌면 항상 동기화 (표시 불일치 방지)
      if (storedPersonality?.id === selectedPersonalityId) return;
      const personality = await getPersonalityByIdAsync(selectedPersonalityId);
      if (personality) {
        setSelectedPersonality({
          id: personality.id,
          name: personality.name,
          description: personality.description,
          shortDescription: personality.shortDescription,
          iconType: personality.iconType,
        });
      }
    };
    loadSelectedPersonality();
  }, [selectedPersonalityId, storedPersonality?.id, setSelectedPersonality]);

  const handlePersonalityChange = async (personality: AIPersonality) => {
    await saveSelectedPersonalityId(personality.id);
    // 성격 정보를 스토어에 저장
    setSelectedPersonality({
      id: personality.id,
      name: personality.name,
      description: personality.description,
      shortDescription: personality.shortDescription,
      iconType: personality.iconType,
    });
    setShowPersonalitySelector(false);
  };

  const handleKakaoLogout = () => {
    clearUser();
    signOut({ callbackUrl: "/?logout=true" });
  };

  if (showPersonalitySelector) {
    return (
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-sm border-b border-stone-200 px-6 py-4">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowPersonalitySelector(false)}
              className="text-green-700 hover:text-green-800 cursor-pointer"
            >
              ‹
            </button>
            <h1 className="text-lg font-semibold text-green-700">
              Moo 성격 설정
            </h1>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-4">
          <PersonalitySelector
            selectedId={selectedPersonalityId}
            onPersonalityChange={handlePersonalityChange}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-stone-200 px-6 py-4">
        <h1 className="text-lg font-semibold text-green-700">설정</h1>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 space-y-4">
        <ProfileSection user={user} />

        <AIPersonalitySection
          storedPersonality={
            storedPersonality as {
              id: string;
              name: string;
              description: string;
              shortDescription: string;
              iconType: string;
            } | null
          }
          onPersonalitySelectorOpen={() => setShowPersonalitySelector(true)}
        />

        <SettingsOptions />

        <AppInfo />

        <LogoutButton onLogout={handleKakaoLogout} />
      </div>
    </div>
  );
}
