"use client";

export default function AppInfo() {
  return (
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
  );
}
