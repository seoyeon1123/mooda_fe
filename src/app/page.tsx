"use client";

import { Button } from "@/components/ui/Button";
export default function HomePage() {
  const handleKakaoLogin = () => {
    // 카카오 로그인 로직 구현 예정
    console.log("카카오 로그인 시작");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-100 via-stone-50 to-green-50 flex flex-col">
      {/* Header */}
      <div className="flex-1 flex flex-col justify-center px-6 py-8">
        {/* Logo Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-28 h-28 bg-gradient-to-br from-green-400 via-green-500 to-green-600 rounded-3xl mb-6 shadow-2xl relative overflow-hidden">
            {/* 배경 패턴 */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>

            {/* 메인 "m" 모양 디자인 */}
            <div className="relative z-10">
              {/* M자 형태의 감정 곡선 */}
              <svg
                width="48"
                height="36"
                viewBox="0 0 48 36"
                className="text-white"
              >
                <path
                  d="M4 32 L4 8 Q4 4 8 4 Q12 4 12 8 L12 16 L20 8 Q24 4 28 8 L36 16 L36 8 Q36 4 40 4 Q44 4 44 8 L44 32"
                  stroke="currentColor"
                  strokeWidth="3"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {/* 감정 포인트들 */}
                <circle cx="12" cy="20" r="2" fill="rgba(255,255,255,0.8)" />
                <circle cx="24" cy="12" r="2.5" fill="rgba(255,255,255,0.9)" />
                <circle cx="36" cy="20" r="2" fill="rgba(255,255,255,0.8)" />
              </svg>
            </div>

            {/* 떠다니는 감정 요소들 */}
            <div className="absolute top-3 right-4 w-2 h-2 bg-yellow-300 rounded-full animate-pulse"></div>
            <div className="absolute bottom-4 left-3 w-1.5 h-1.5 bg-pink-300 rounded-full animate-pulse delay-300"></div>
            <div className="absolute top-5 left-5 w-1 h-1 bg-blue-300 rounded-full animate-pulse delay-700"></div>
            <div className="absolute bottom-3 right-3 w-1 h-1 bg-purple-300 rounded-full animate-pulse delay-500"></div>

            {/* 미묘한 하이라이트 */}
            <div className="absolute top-2 left-4 w-8 h-1 bg-white/20 rounded-full blur-sm"></div>
          </div>

          <div className="text-green-700 font-semibold text-4xl">MOODA</div>
        </div>

        {/* Description */}
        <div className="text-center ">
          <p className="text-gray-600 text-base leading-relaxed">
            moo에게 오늘 있었던 일을
            <br />
            이야기 하러 가볼까요?
          </p>
        </div>
      </div>
      {/* Login Section */}
      <div className="px-6 pb-8">
        <Button
          onClick={handleKakaoLogin}
          className="w-full h-16 bg-[#FEE500] hover:bg-[#FDD835] text-black font-bold text-xl rounded-3xl shadow-2xl transition-all duration-300 hover:shadow-3xl hover:-translate-y-1 relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 animate-pulse"></div>
          <div className="flex items-center justify-center gap-4 relative z-10">
            <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center shadow-lg">
              <span className="text-[#FEE500] text-sm font-bold">K</span>
            </div>
            카카오로 시작하기
          </div>
        </Button>

        <p className="text-center text-xs text-gray-500 mt-6 leading-relaxed">
          로그인 시 서비스 이용약관 및 개인정보처리방침에
          <br />
          동의한 것으로 간주됩니다
        </p>
      </div>
    </div>
  );
}
