'use client';

import { Input } from '@/components/ui/Input';

interface NameInputStepProps {
  mooName: string;
  onNameChange: (name: string) => void;
}

export default function NameInputStep({
  mooName,
  onNameChange,
}: NameInputStepProps) {
  return (
    <div className="bg-white rounded-3xl p-4 shadow-sm">
      <Input
        type="text"
        value={mooName}
        onChange={(e) => onNameChange(e.target.value)}
        placeholder="moo의 이름을 입력해주세요"
        className="border-0 focus:border-2 focus:border-green-600 rounded-2xl h-16 text-lg bg-stone-50 text-center focus:bg-white transition-all"
      />
    </div>
  );
}
