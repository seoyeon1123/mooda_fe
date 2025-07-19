'use client';

import { useState, useEffect } from 'react';
import {
  User,
  Bell,
  Shield,
  HelpCircle,
  LogOut,
  Bot,
  Camera,
} from 'lucide-react';
import type { AIPersonality } from '@/lib/ai-personalities';
import { getPersonalityByIdAsync } from '@/lib/ai-personalities';
import PersonalitySelector from './components/PersonalitySelector';
import MooIcon from './components/MooIcon';
import { signOut } from 'next-auth/react';
import useUserStore from '@/store/userStore';
import Image from 'next/image';

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
  }, []); // 빈 의존성 배열로 변경

  // 선택된 성격 로드 (커스텀 AI 포함)
  useEffect(() => {
    const loadSelectedPersonality = async () => {
      // 스토어에 성격 정보가 없고 selectedPersonalityId가 있으면 로드
      if (selectedPersonalityId && !storedPersonality) {
        const personality = await getPersonalityByIdAsync(
          selectedPersonalityId
        );
        if (personality) {
          setSelectedPersonality({
            id: personality.id,
            name: personality.name,
            description: personality.description,
            shortDescription: personality.shortDescription,
            iconType: personality.iconType,
          });
        }
      }
    };
    loadSelectedPersonality();
  }, [selectedPersonalityId, storedPersonality, setSelectedPersonality]);

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
    signOut({ callbackUrl: '/?logout=true' });
  };

  if (showPersonalitySelector) {
    return (
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-sm border-b border-stone-200 px-6 py-4">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowPersonalitySelector(false)}
              className="text-green-700 hover:text-green-800"
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
        {/* Profile Section */}
        <div className="bg-white/60 rounded-xl p-4">
          <div className="flex items-center space-x-4">
            <div className="relative">
              {user?.image ? (
                <Image
                  src={user.image}
                  alt="profile"
                  width={50}
                  height={50}
                  className="rounded-full"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center">
                  <User size={20} className="text-gray-400" />
                </div>
              )}
              <button className="absolute -bottom-1 -right-1 w-6 h-6 bg-white rounded-full shadow-lg flex items-center justify-center border border-gray-200">
                <Camera size={12} className="text-gray-600" />
              </button>
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-lg">{user?.name}</span>
            </div>
          </div>
        </div>

        {/* AI Personality Section */}
        <div className="bg-white/60 rounded-xl p-4">
          <h3 className="font-semibold text-gray-800 mb-3">Moo 성격 설정</h3>
          <button
            onClick={() => setShowPersonalitySelector(true)}
            className="w-full bg-white/60 rounded-lg p-3 flex items-center justify-between hover:bg-white/80 transition-colors border border-gray-100"
          >
            <div className="flex items-center space-x-3">
              <Bot size={20} className="text-gray-600" />
              <div className="text-left">
                {storedPersonality && (
                  <span className="text-sm text-gray-500 flex flex-row items-center gap-1">
                    현재는
                    <MooIcon
                      type={
                        storedPersonality.iconType as
                          | 'user'
                          | 'friendly'
                          | 'wise'
                          | 'energetic'
                          | 'calm'
                          | 'INTJ'
                          | 'INTP'
                          | 'ENTJ'
                          | 'ENTP'
                          | 'INFJ'
                          | 'INFP'
                          | 'ENFJ'
                          | 'ENFP'
                          | 'ISTJ'
                          | 'ISFJ'
                          | 'ESTJ'
                          | 'ESFJ'
                          | 'ISTP'
                          | 'ISFP'
                          | 'ESTP'
                          | 'ESFP'
                          | 'default'
                      }
                      size={20}
                    />
                    <span className="font-bold text-green-800">
                      {storedPersonality.name}
                    </span>
                    와 대화중이에요
                  </span>
                )}
              </div>
            </div>
            <span className="text-gray-400">›</span>
          </button>
        </div>

        {/* Settings Options */}
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

        {/* App Info */}
        <div className="bg-white/60 rounded-xl p-4">
          <h3 className="font-semibold text-gray-800 mb-2">앱 정보</h3>
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex justify-between">
              <span>버전</span>
              <span>1.0.0</span>
            </div>
            <div className="flex justify-between">
              <span>개발자</span>
              <span>MOODA Team</span>
            </div>
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={handleKakaoLogout}
          className="w-full bg-red-50 border border-red-200 rounded-xl p-4 flex items-center justify-center space-x-2 hover:bg-red-100 transition-colors"
        >
          <LogOut size={20} className="text-red-600" />
          <span className="text-red-600 font-medium">로그아웃</span>
        </button>
      </div>
    </div>
  );
}
