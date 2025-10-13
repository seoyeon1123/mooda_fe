"use client";

import { Bot } from "lucide-react";
import MooIcon from "./MooIcon";

interface AIPersonalitySectionProps {
  storedPersonality: {
    id: string;
    name: string;
    description: string;
    shortDescription: string;
    iconType: string;
  } | null;
  onPersonalitySelectorOpen: () => void;
}

export default function AIPersonalitySection({
  storedPersonality,
  onPersonalitySelectorOpen,
}: AIPersonalitySectionProps) {
  return (
    <div className="bg-white/60 rounded-xl p-4">
      <h3 className="font-semibold text-gray-800 mb-3">Moo 성격 설정</h3>
      <button
        onClick={onPersonalitySelectorOpen}
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
                      | "user"
                      | "friendly"
                      | "wise"
                      | "energetic"
                      | "calm"
                      | "INTJ"
                      | "INTP"
                      | "ENTJ"
                      | "ENTP"
                      | "INFJ"
                      | "INFP"
                      | "ENFJ"
                      | "ENFP"
                      | "ISTJ"
                      | "ISFJ"
                      | "ESTJ"
                      | "ESFJ"
                      | "ISTP"
                      | "ISFP"
                      | "ESTP"
                      | "ESFP"
                      | "default"
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
  );
}
