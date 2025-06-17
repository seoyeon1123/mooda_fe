import Image from "next/image";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
}

export function Logo({ size = "md", showText = false }: LogoProps) {
  const sizeClasses = {
    sm: "w-10 h-10",
    md: "w-16 h-16",
    lg: "w-28 h-28",
  };

  const imageSizes = {
    sm: { width: 24, height: 18 },
    md: { width: 32, height: 24 },
    lg: { width: 48, height: 36 },
  };

  const containerClasses = {
    sm: "rounded-full shadow-sm",
    md: "rounded-2xl shadow-lg",
    lg: "rounded-3xl shadow-2xl",
  };

  const floatingElements = {
    sm: [
      {
        className:
          "absolute top-1 right-1.5 w-1 h-1 bg-yellow-300 rounded-full animate-pulse",
      },
      {
        className:
          "absolute bottom-1.5 left-1 w-0.5 h-0.5 bg-pink-300 rounded-full animate-pulse delay-300",
      },
      {
        className:
          "absolute top-1.5 left-1.5 w-0.5 h-0.5 bg-blue-300 rounded-full animate-pulse delay-700",
      },
      {
        className:
          "absolute bottom-1 right-1 w-0.5 h-0.5 bg-purple-300 rounded-full animate-pulse delay-500",
      },
    ],
    md: [
      {
        className:
          "absolute top-2 right-2 w-1.5 h-1.5 bg-yellow-300 rounded-full animate-pulse",
      },
      {
        className:
          "absolute bottom-2 left-1.5 w-1 h-1 bg-pink-300 rounded-full animate-pulse delay-300",
      },
      {
        className:
          "absolute top-2.5 left-2.5 w-1 h-1 bg-blue-300 rounded-full animate-pulse delay-700",
      },
      {
        className:
          "absolute bottom-1.5 right-1.5 w-1 h-1 bg-purple-300 rounded-full animate-pulse delay-500",
      },
    ],
    lg: [
      {
        className:
          "absolute top-3 right-4 w-2 h-2 bg-yellow-300 rounded-full animate-pulse",
      },
      {
        className:
          "absolute bottom-4 left-3 w-1.5 h-1.5 bg-pink-300 rounded-full animate-pulse delay-300",
      },
      {
        className:
          "absolute top-5 left-5 w-1 h-1 bg-blue-300 rounded-full animate-pulse delay-700",
      },
      {
        className:
          "absolute bottom-3 right-3 w-1 h-1 bg-purple-300 rounded-full animate-pulse delay-500",
      },
    ],
  };

  const highlightElements = {
    sm: "absolute top-1 left-2 w-3 h-0.5 bg-white/20 rounded-full blur-sm",
    md: "absolute top-1.5 left-3 w-4 h-0.5 bg-white/20 rounded-full blur-sm",
    lg: "absolute top-2 left-4 w-8 h-1 bg-white/20 rounded-full blur-sm",
  };

  return (
    <div
      className={`inline-flex items-center justify-center bg-gradient-to-br from-green-400 via-green-500 to-green-600 shadow-lg relative overflow-hidden ${containerClasses[size]}`}
    >
      <div className={`${sizeClasses[size]}`}>
        {/* 배경 패턴 */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>

        {/* 메인 "m" 모양 디자인 */}
        <div className="relative z-10 flex items-center justify-center w-full h-full">
          <Image
            src="/images/logo.svg"
            alt="logo"
            width={imageSizes[size].width}
            height={imageSizes[size].height}
          />
        </div>

        {/* 떠다니는 감정 요소들 */}
        {floatingElements[size].map((element, index) => (
          <div key={index} className={element.className}></div>
        ))}

        {/* 미묘한 하이라이트 */}
        <div className={highlightElements[size]}></div>
      </div>

      {showText && (
        <div className="text-green-700 font-semibold text-4xl ml-4">MOODA</div>
      )}
    </div>
  );
}
