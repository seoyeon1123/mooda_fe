"use client";

import { Button } from "@/components/ui/Button";
import { ArrowLeft, Eye } from "lucide-react";

interface HeaderProps {
  currentStep: number;
  totalSteps: number;
  onPrev: () => void;
  onShowSummary: () => void;
}

export default function Header({
  currentStep,
  totalSteps,
  onPrev,
  onShowSummary,
}: HeaderProps) {
  return (
    <div className="sticky top-0 z-10 bg-stone-100/90 backdrop-blur-lg">
      <div className="flex items-center justify-between p-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={onPrev}
          className="rounded-full cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="text-green-700 font-semibold text-lg">
          {currentStep + 1}/{totalSteps} 단계
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onShowSummary}
          className="rounded-full cursor-pointer"
        >
          <Eye className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
}
