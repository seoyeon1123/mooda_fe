import { TbAlphabetKorean } from "react-icons/tb";
import { GiIBrick } from "react-icons/gi";
import Link from "next/link";

export default function MiniGamePage() {
  return (
    <div className="flex flex-col h-full">
      <div className="bg-white/80 backdrop-blur-sm border-b border-stone-200 px-6 py-4">
        <h1 className="text-lg font-semibold text-black">미니 게임</h1>
      </div>

      <main className="flex-1 p-4 flex items-center justify-center">
        <div className="grid grid-cols-2 gap-4 max-w-2xl w-full">
          <Link
            href="/mini_game/word-chain"
            className="flex flex-col items-center h-48 justify-center gap-3 bg-white/80 backdrop-blur-sm border border-stone-200 px-4 py-5 rounded-xl hover:bg-stone-50 transition-colors active:scale-[0.98]"
          >
            <TbAlphabetKorean className="w-12 h-12 bg-emerald-600 rounded-xl p-2 text-white" />
            <div className="flex flex-col items-center text-center">
              <h2 className="text-base font-semibold text-black">끝말잇기</h2>
              <p className="text-xs text-stone-600 leading-relaxed">
                심심할 땐, 컴퓨터와 끝말잇기 해보세요!
              </p>
            </div>
          </Link>

          <Link
            href="/mini_game/tetris"
            className="flex flex-col h-48 items-center justify-center gap-3 bg-white/80 backdrop-blur-sm border border-stone-200 px-4 py-5 rounded-xl hover:bg-stone-50 transition-colors active:scale-[0.98]"
          >
            <GiIBrick className="w-12 h-12 bg-emerald-600 rounded-xl p-2 text-white" />
            <div className="flex flex-col items-center text-center">
              <h2 className="text-base font-semibold text-black">테트리스</h2>
              <p className="text-xs text-stone-600 leading-relaxed">
                심심할 땐, 테트리스로 시간 가는 줄 모르게!
              </p>
            </div>
          </Link>

          {/* 추가 게임 슬롯 1 */}
          <div className="flex flex-col h-48 items-center justify-center gap-3 bg-white/40 backdrop-blur-sm border border-stone-200 px-4 py-5 rounded-xl opacity-60">
            <div className="w-12 h-12 bg-stone-300 rounded-xl p-2 text-stone-500 flex items-center justify-center">
              <span className="text-xl">🎮</span>
            </div>
            <div className="flex flex-col items-center text-center">
              <h2 className="text-base font-semibold text-stone-400">
                게임 준비중
              </h2>
              <p className="text-xs text-stone-500 leading-relaxed">
                새로운 게임이 곧 추가됩니다!
              </p>
            </div>
          </div>

          {/* 추가 게임 슬롯 2 */}
          <div className="flex flex-col h-48 items-center justify-center gap-3 bg-white/40 backdrop-blur-sm border border-stone-200 px-4 py-5 rounded-xl opacity-60">
            <div className="w-12 h-12 bg-stone-300 rounded-xl p-2 text-stone-500 flex items-center justify-center">
              <span className="text-xl">🎯</span>
            </div>
            <div className="flex flex-col items-center text-center">
              <h2 className="text-base font-semibold text-stone-400">
                게임 준비중
              </h2>
              <p className="text-xs text-stone-500 leading-relaxed">
                새로운 게임이 곧 추가됩니다!
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Additional Content */}
      <div className="mx-auto max-w-md rounded-2xl bg-card/50 p-4 text-center backdrop-blur-sm">
        <p className="text-sm text-muted-foreground">
          💡 게임을 즐기면서 두뇌를 활성화하세요
        </p>
      </div>
    </div>
  );
}
