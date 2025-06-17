"use client";

import Image from "next/image";
import { Logo } from "@/components/ui/Logo";

export default function HomePage() {
  const handleKakaoLogin = () => {
    // 카카오 로그인 로직 구현 예정
    console.log("카카오 로그인 시작");
  };

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col">
      {/* Header */}
      <div className="flex-1 flex flex-col justify-center px-6 py-8">
        {/* Logo Section */}
        <div className="text-center mb-12">
          <div className="mb-6">
            <Logo size="lg" />
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
        <div
          className="w-full h-16 relative cursor-pointer"
          onClick={handleKakaoLogin}
        >
          <Image
            src="/images/kakao_login.png"
            alt="카카오 로그인"
            fill
            className="object-contain"
          />
        </div>

        <p className="text-center text-xs text-gray-500 mt-6 leading-relaxed">
          로그인 시 서비스 이용약관 및 개인정보처리방침에
          <br />
          동의한 것으로 간주됩니다
        </p>
      </div>
    </div>
  );
}
