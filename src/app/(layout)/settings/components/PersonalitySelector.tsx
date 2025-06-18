"use client";

import { useState, useEffect } from "react";
import { AI_PERSONALITIES, type AIPersonality } from "@/lib/ai-personalities";
import { loadSettings, updatePersonality } from "@/lib/settings";
import { Check } from "lucide-react";
import MooIcon from "./MooIcon";

interface PersonalitySelectorProps {
  onPersonalityChange?: (personality: AIPersonality) => void;
}

export default function PersonalitySelector({
  onPersonalityChange,
}: PersonalitySelectorProps) {
  const [selectedId, setSelectedId] = useState<string>("");

  useEffect(() => {
    const settings = loadSettings();
    setSelectedId(settings.selectedPersonalityId);
  }, []);

  const handlePersonalitySelect = (personality: AIPersonality) => {
    setSelectedId(personality.id);
    updatePersonality(personality.id);
    onPersonalityChange?.(personality);
  };

  return (
    <div className="space-y-3">
      {AI_PERSONALITIES.map((personality) => (
        <div
          key={personality.id}
          className={`
            relative bg-white/60 rounded-xl p-5 cursor-pointer transition-all duration-200 active:scale-95
            ${
              selectedId === personality.id
                ? "bg-green-50 border-2 border-green-300 shadow-md"
                : "border border-gray-200 hover:bg-white/80 hover:shadow-sm"
            }
          `}
          onClick={() => handlePersonalitySelect(personality)}
        >
          {/* Selection Indicator */}
          {selectedId === personality.id && (
            <div className="absolute top-4 right-4 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
              <Check size={16} className="text-white" />
            </div>
          )}

          <div>
            {/* 이미지와 이름을 나란히 */}
            <div className="flex items-center space-x-4 mb-3">
              <MooIcon type={personality.iconType} size={48} />
              <h4 className="font-bold text-gray-800 text-lg">
                {personality.name}
              </h4>
            </div>

            {/* 설명을 아래에 */}
            <p className="text-sm text-gray-600 leading-relaxed font-medium">
              &quot;{personality.shortDescription}&quot;
            </p>
            <p className="text-xs text-gray-400 leading-relaxed font-medium">
              {personality.description}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
