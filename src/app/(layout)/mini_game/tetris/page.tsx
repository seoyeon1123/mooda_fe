'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 18;
const CELL_SIZE = 20;

// 테트리스 블록 타입들
const TETRIS_PIECES = {
  I: {
    shape: [[1, 1, 1, 1]],
    color: '#14b8a6', // teal-500
  },
  O: {
    shape: [
      [1, 1],
      [1, 1],
    ],
    color: '#f59e0b', // amber-500
  },
  T: {
    shape: [
      [0, 1, 0],
      [1, 1, 1],
    ],
    color: '#8b5cf6', // violet-500
  },
  S: {
    shape: [
      [0, 1, 1],
      [1, 1, 0],
    ],
    color: '#10b981', // emerald-500
  },
  Z: {
    shape: [
      [1, 1, 0],
      [0, 1, 1],
    ],
    color: '#ef4444', // red-500
  },
  J: {
    shape: [
      [1, 0, 0],
      [1, 1, 1],
    ],
    color: '#3b82f6', // blue-500
  },
  L: {
    shape: [
      [0, 0, 1],
      [1, 1, 1],
    ],
    color: '#f97316', // orange-500
  },
};

// 게임 상태 타입
interface GameState {
  board: number[][];
  currentPiece: Piece | null;
  nextPiece: Piece | null;
  score: number;
  level: number;
  lines: number;
  gameOver: boolean;
  paused: boolean;
}

interface Piece {
  shape: number[][];
  x: number;
  y: number;
  color: string;
}

export default function TetrisGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<number>(0);

  const [gameState, setGameState] = useState<GameState>({
    board: Array(BOARD_HEIGHT)
      .fill(null)
      .map(() => Array(BOARD_WIDTH).fill(0)),
    currentPiece: null,
    nextPiece: null,
    score: 0,
    level: 1,
    lines: 0,
    gameOver: false,
    paused: false,
  });

  // 빈 보드 생성
  const createEmptyBoard = useCallback(() => {
    return Array(BOARD_HEIGHT)
      .fill(null)
      .map(() => Array(BOARD_WIDTH).fill(0));
  }, []);

  // 랜덤 블록 생성
  const createRandomPiece = useCallback((): Piece => {
    const pieceTypes = Object.keys(TETRIS_PIECES);
    const randomType = pieceTypes[
      Math.floor(Math.random() * pieceTypes.length)
    ] as keyof typeof TETRIS_PIECES;
    const pieceData = TETRIS_PIECES[randomType];

    return {
      shape: pieceData.shape,
      x:
        Math.floor(BOARD_WIDTH / 2) - Math.floor(pieceData.shape[0].length / 2),
      y: 0,
      color: pieceData.color,
    };
  }, []);

  // 블록 회전
  const rotatePiece = useCallback((piece: Piece): Piece => {
    const rows = piece.shape.length;
    const cols = piece.shape[0].length;
    const rotated = Array(cols)
      .fill(null)
      .map(() => Array(rows).fill(0));

    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        rotated[j][rows - 1 - i] = piece.shape[i][j];
      }
    }

    return {
      ...piece,
      shape: rotated,
    };
  }, []);

  // 유효한 위치인지 확인
  const isValidPosition = useCallback(
    (board: number[][], piece: Piece, dx = 0, dy = 0): boolean => {
      for (let y = 0; y < piece.shape.length; y++) {
        for (let x = 0; x < piece.shape[y].length; x++) {
          if (piece.shape[y][x]) {
            const newX = piece.x + x + dx;
            const newY = piece.y + y + dy;

            // 보드 경계 체크
            if (newX < 0 || newX >= BOARD_WIDTH || newY >= BOARD_HEIGHT) {
              return false;
            }

            // 다른 블록과 충돌 체크
            if (newY >= 0 && board[newY][newX]) {
              return false;
            }
          }
        }
      }
      return true;
    },
    []
  );

  // 블록을 보드에 고정
  const placePiece = useCallback(
    (board: number[][], piece: Piece): number[][] => {
      const newBoard = board.map((row) => [...row]);

      for (let y = 0; y < piece.shape.length; y++) {
        for (let x = 0; x < piece.shape[y].length; x++) {
          if (piece.shape[y][x]) {
            const boardY = piece.y + y;
            const boardX = piece.x + x;
            if (
              boardY >= 0 &&
              boardY < BOARD_HEIGHT &&
              boardX >= 0 &&
              boardX < BOARD_WIDTH
            ) {
              newBoard[boardY][boardX] = 1; // 색상은 나중에 처리
            }
          }
        }
      }

      return newBoard;
    },
    []
  );

  // 라인 클리어
  const clearLines = useCallback(
    (board: number[][]): { board: number[][]; linesCleared: number } => {
      const newBoard = [...board];
      let linesCleared = 0;

      for (let y = BOARD_HEIGHT - 1; y >= 0; y--) {
        if (newBoard[y].every((cell) => cell !== 0)) {
          newBoard.splice(y, 1);
          newBoard.unshift(Array(BOARD_WIDTH).fill(0));
          linesCleared++;
          y++; // 같은 라인 다시 체크
        }
      }

      return { board: newBoard, linesCleared };
    },
    []
  );

  // 점수 업데이트
  const updateScore = useCallback((linesCleared: number) => {
    const scoreValues = [0, 40, 100, 300, 1200]; // 0, 1, 2, 3, 4라인 클리어 점수
    return scoreValues[linesCleared] || 0;
  }, []);

  // 게임 초기화
  const initializeGame = useCallback(() => {
    const newPiece = createRandomPiece();
    const nextPiece = createRandomPiece();

    setGameState({
      board: createEmptyBoard(),
      currentPiece: newPiece,
      nextPiece: nextPiece,
      score: 0,
      level: 1,
      lines: 0,
      gameOver: false,
      paused: false,
    });
  }, [createEmptyBoard, createRandomPiece]);

  // 게임 오버 체크
  const isGameOver = useCallback(
    (board: number[][], piece: Piece): boolean => {
      return !isValidPosition(board, piece);
    },
    [isValidPosition]
  );

  // 게임 루프
  const gameLoop = useCallback(() => {
    setGameState((prev) => {
      if (prev.gameOver || prev.paused || !prev.currentPiece) return prev;

      const currentPiece = prev.currentPiece;

      // 블록 자동 하강
      if (isValidPosition(prev.board, currentPiece, 0, 1)) {
        return {
          ...prev,
          currentPiece: {
            ...currentPiece,
            y: currentPiece.y + 1,
          },
        };
      } else {
        // 블록 고정
        const newBoard = placePiece(prev.board, currentPiece);

        // 라인 클리어 체크
        const { board: clearedBoard, linesCleared } = clearLines(newBoard);
        const scoreIncrease = updateScore(linesCleared);

        // 게임 오버 체크
        if (isGameOver(clearedBoard, prev.nextPiece!)) {
          return {
            ...prev,
            gameOver: true,
            board: clearedBoard,
          };
        }

        // 다음 블록으로 전환
        return {
          ...prev,
          board: clearedBoard,
          currentPiece: prev.nextPiece,
          nextPiece: createRandomPiece(),
          score: prev.score + scoreIncrease,
          lines: prev.lines + linesCleared,
          level: Math.floor((prev.lines + linesCleared) / 10) + 1,
        };
      }
    });
  }, [
    isValidPosition,
    placePiece,
    clearLines,
    updateScore,
    isGameOver,
    createRandomPiece,
  ]);

  // 키보드 입력 처리
  const handleKeyPress = useCallback(
    (event: KeyboardEvent) => {
      if (gameState.gameOver) return;

      setGameState((prev) => {
        if (!prev.currentPiece || prev.paused) return prev;

        const currentPiece = prev.currentPiece;

        switch (event.key) {
          case 'ArrowLeft':
            if (isValidPosition(prev.board, currentPiece, -1, 0)) {
              return {
                ...prev,
                currentPiece: { ...currentPiece, x: currentPiece.x - 1 },
              };
            }
            break;

          case 'ArrowRight':
            if (isValidPosition(prev.board, currentPiece, 1, 0)) {
              return {
                ...prev,
                currentPiece: { ...currentPiece, x: currentPiece.x + 1 },
              };
            }
            break;

          case 'ArrowDown':
            if (isValidPosition(prev.board, currentPiece, 0, 1)) {
              return {
                ...prev,
                currentPiece: { ...currentPiece, y: currentPiece.y + 1 },
              };
            }
            break;

          case 'ArrowUp':
            const rotatedPiece = rotatePiece(currentPiece);
            if (isValidPosition(prev.board, rotatedPiece)) {
              return {
                ...prev,
                currentPiece: rotatedPiece,
              };
            }
            break;

          case ' ':
            // 하드 드롭
            let dropY = currentPiece.y;
            while (
              isValidPosition(
                prev.board,
                currentPiece,
                0,
                dropY - currentPiece.y + 1
              )
            ) {
              dropY++;
            }
            return {
              ...prev,
              currentPiece: { ...currentPiece, y: dropY },
            };
        }

        return prev;
      });
    },
    [gameState.gameOver, isValidPosition, rotatePiece]
  );

  // 렌더링
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 캔버스 크기 설정
    canvas.width = BOARD_WIDTH * CELL_SIZE;
    canvas.height = BOARD_HEIGHT * CELL_SIZE;

    // 배경 그리기
    ctx.fillStyle = '#f5f5f5';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 보드 그리기
    for (let y = 0; y < BOARD_HEIGHT; y++) {
      for (let x = 0; x < BOARD_WIDTH; x++) {
        if (gameState.board[y][x]) {
          ctx.fillStyle = '#e5e5e5';
          ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
          ctx.strokeStyle = '#d4d4d4';
          ctx.strokeRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        }
      }
    }

    // 현재 블록 그리기
    if (gameState.currentPiece) {
      const piece = gameState.currentPiece;
      ctx.fillStyle = piece.color;

      for (let y = 0; y < piece.shape.length; y++) {
        for (let x = 0; x < piece.shape[y].length; x++) {
          if (piece.shape[y][x]) {
            const drawX = (piece.x + x) * CELL_SIZE;
            const drawY = (piece.y + y) * CELL_SIZE;

            ctx.fillRect(drawX, drawY, CELL_SIZE, CELL_SIZE);
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 1.5;
            ctx.strokeRect(drawX, drawY, CELL_SIZE, CELL_SIZE);
          }
        }
      }
    }
  }, [gameState]);

  // 게임 시작/일시정지 토글
  const togglePause = useCallback(() => {
    setGameState((prev) => ({ ...prev, paused: !prev.paused }));
  }, []);

  // 게임 재시작
  const restartGame = useCallback(() => {
    initializeGame();
  }, [initializeGame]);

  // 이벤트 리스너 등록
  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleKeyPress]);

  // 게임 루프 시작
  useEffect(() => {
    if (!gameState.gameOver && !gameState.paused) {
      const interval = 1000 - (gameState.level - 1) * 100; // 레벨에 따라 속도 증가
      gameLoopRef.current = window.setInterval(
        gameLoop,
        Math.max(interval, 100)
      );
    } else {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
      }
    }

    return () => {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
      }
    };
  }, [gameLoop, gameState.gameOver, gameState.paused, gameState.level]);

  // 렌더링
  useEffect(() => {
    render();
  }, [render]);

  // 게임 초기화
  useEffect(() => {
    initializeGame();
  }, [initializeGame]);

  return (
    <div className=" bg-stone-50 overflow-hidden">
      <header className="bg-white border-b border-stone-200 px-4 py-3 flex items-center gap-3 flex-shrink-0">
        <Link
          href="/mini_game"
          className="text-stone-600 hover:text-stone-900 transition-colors"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </Link>
        <h1 className="text-base font-semibold text-stone-900">테트리스</h1>
      </header>

      <main className="flex-1 overflow-hidden p-2 flex flex-col items-center justify-center mt-20">
        <div className="flex flex-col items-center gap-2 w-full max-w-sm">
          {/* 게임 보드 */}
          <div className="flex flex-col items-center w-full">
            <canvas
              ref={canvasRef}
              className="border-2 border-stone-300 bg-stone-50 rounded-lg shadow-lg mx-auto"
              style={{
                width: BOARD_WIDTH * CELL_SIZE,
                height: BOARD_HEIGHT * CELL_SIZE,
              }}
            />

            <div className="mt-2 w-full">
              <div className="bg-white rounded-lg p-2 shadow-sm border border-stone-100 mb-2">
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <div className="text-xs text-stone-500 mb-0.5">점수</div>
                    <div className="text-base font-bold text-stone-900">
                      {gameState.score}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-stone-500 mb-0.5">레벨</div>
                    <div className="text-base font-bold text-stone-900">
                      {gameState.level}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-stone-500 mb-0.5">라인</div>
                    <div className="text-base font-bold text-stone-900">
                      {gameState.lines}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={togglePause}
                  className="flex-1 bg-white text-stone-900 border border-stone-200 rounded-lg px-2 py-1.5 text-xs font-medium hover:bg-stone-50 transition-colors"
                >
                  {gameState.paused ? '계속' : '일시정지'}
                </Button>
                <Button
                  onClick={restartGame}
                  className="flex-1 bg-teal-600 text-white rounded-lg px-2 py-1.5 text-xs font-medium hover:bg-teal-700 transition-colors"
                >
                  다시 시작
                </Button>
              </div>
            </div>
          </div>

          <div className="w-full">
            <div className="bg-white rounded-lg p-2 shadow-sm border border-stone-100">
              <h3 className="text-sm font-semibold text-stone-900 mb-1">
                다음 블록
              </h3>
              <div className="w-16 h-16 mx-auto border border-stone-200 bg-stone-50 rounded-lg flex items-center justify-center">
                {gameState.nextPiece && (
                  <div className="text-white text-xs">
                    {gameState.nextPiece.shape.map((row, y) => (
                      <div key={y} className="flex">
                        {row.map((cell, x) => (
                          <div
                            key={x}
                            className={`w-2.5 h-2.5 ${cell ? 'bg-white' : ''}`}
                            style={{
                              backgroundColor: cell
                                ? gameState.nextPiece?.color
                                : 'transparent',
                            }}
                          />
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {gameState.gameOver && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 text-center max-w-sm w-full shadow-xl">
            <h2 className="text-xl font-bold text-stone-900 mb-2">
              게임 오버!
            </h2>
            <p className="text-stone-600 mb-4">
              최종 점수:{' '}
              <span className="font-bold text-teal-600">{gameState.score}</span>
            </p>
            <Button
              onClick={restartGame}
              className="w-full bg-teal-600 text-white rounded-lg px-6 py-2.5 font-medium hover:bg-teal-700 transition-colors"
            >
              다시 시작
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
