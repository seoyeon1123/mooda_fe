'use client';
import { RiEmotion2Line } from 'react-icons/ri';

export default function CalendarHeader() {
  return (
    <div className="sticky top-0 z-10 px-4 py-2.5 flex-shrink-0 bg-white/80 ">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3 flex-1">
          <div className="flex-1 min-w-0 flex flex-row items-center gap-2">
            <RiEmotion2Line color="green" />

            <h1 className="text-lg font-semibold text-gray-900">무디 로그</h1>
          </div>
        </div>
      </div>
    </div>
  );
}
