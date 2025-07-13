'use client';

import { useRef, useEffect, useState } from 'react';
import DialogueBox from './DialogueBox'; // 新しいコンポーネントをインポート

// --- 型定義 ---
type Message = { sender: 'player' | 'npc'; text: string; };

// --- 定数定義 ---
const TILE_SIZE = 32; // ゲーム世界でのタイルの大きさ
const MAP_WIDTH_IN_TILES = 25;
const MAP_HEIGHT_IN_TILES = 17;
const CANVAS_WIDTH = TILE_SIZE * MAP_WIDTH_IN_TILES;
const CANVAS_HEIGHT = TILE_SIZE * MAP_HEIGHT_IN_TILES;
const PLAYER_SPEED = 4;
const PLAYER_WIDTH = TILE_SIZE / 2;
const PLAYER_HEIGHT = TILE_SIZE / 2;

// --- データ ---
const tileMap = [
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 3, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 3, 0, 0, 28, 0, 0, 0, 0, 0, 0, 28, 0, 0, 28, 0, 0, 3, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 28, 0, 0, 3, 0, 0, 0, 28, 0, 0, 28, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 28, 0, 0, 0, 0, 0, 0, 28, 0, 0, 28, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 28, 0, 0, 0, 0, 0, 0, 28, 0, 0, 28, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 1, 1, 1, 1, 28, 1, 1, 1, 1, 1, 1, 28, 1, 1, 28, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 0, 0, 0, 0, 28, 0, 0, 0, 0, 0, 0, 28, 0, 0, 28, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 28, 0, 0, 0, 3, 0, 0, 28, 0, 0, 28, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 3, 0, 0, 28, 0, 0, 0, 0, 0, 0, 28, 0, 0, 28, 0, 0, 3, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 3, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 3, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
];
const npcs = [{ id: 1, x: TILE_SIZE * 5, y: TILE_SIZE * 10 }];

const Game = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const keysPressed = useRef<{ [key: string]: boolean }>({});
  const playerPos = useRef({ x: TILE_SIZE * 2, y: TILE_SIZE * 2 });

  const [activeConversation, setActiveConversation] = useState<Message[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // --- 当たり判定 ---
  const isWall = (x: number, y: number) => {
    const tileX = Math.floor(x / TILE_SIZE);
    const tileY = Math.floor(y / TILE_SIZE);
    if (tileX < 0 || tileX >= MAP_WIDTH_IN_TILES || tileY < 0 || tileY >= MAP_HEIGHT_IN_TILES) return true;
    return tileMap[tileY][tileX] === 1; // 壁は1
  };
  const checkCollision = (x: number, y: number) => {
    if (isWall(x, y) || isWall(x + PLAYER_WIDTH - 1, y) || isWall(x, y + PLAYER_HEIGHT - 1) || isWall(x + PLAYER_WIDTH - 1, y + PLAYER_HEIGHT - 1)) return true;
    return false;
  };

  // --- 会話処理 ---
  async function startConversation() {
    if (activeConversation) return;
    for (const npc of npcs) {
      const distance = Math.hypot(playerPos.current.x - npc.x, playerPos.current.y - npc.y);
      if (distance < TILE_SIZE * 1.5) {
        setIsLoading(true);
        const initialMessage: Message = { sender: 'player', text: 'こんにちは' };
        setActiveConversation([initialMessage]);
        await sendMessageToServer([initialMessage]);
        return;
      }
    }
  }

  async function sendMessageToServer(history: Message[]) {
    setIsLoading(true);
    try {
      const response = await fetch('/api/gemini-talk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ history }),
      });
      if (!response.ok) throw new Error('API error');
      const data = await response.json();
      setActiveConversation(prev => [...(prev || []), { sender: 'npc', text: data.message }]);
    } catch (error) {
      console.error("API call failed:", error);
      setActiveConversation(prev => [...(prev || []), { sender: 'npc', text: 'エラーが発生しました。' }]);
    } finally {
      setIsLoading(false);
    }
  }

  async function handlePlayerMessage(message: string) {
    const newMessage: Message = { sender: 'player', text: message };
    const newHistory = [...(activeConversation || []), newMessage];
    setActiveConversation(newHistory);
    await sendMessageToServer(newHistory);
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    if (!context) return;
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ') {
        e.preventDefault();
        startConversation();
      } else {
        keysPressed.current[e.key] = true;
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => { keysPressed.current[e.key] = false; };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    let animationFrameId: number;
    const gameLoop = () => {
      if (!activeConversation) {
        let dx = 0;
        let dy = 0;

        if (keysPressed.current['ArrowLeft']) dx -= PLAYER_SPEED;
        if (keysPressed.current['ArrowRight']) dx += PLAYER_SPEED;
        if (keysPressed.current['ArrowUp']) dy -= PLAYER_SPEED;
        if (keysPressed.current['ArrowDown']) dy += PLAYER_SPEED;

        if (dx !== 0 && !checkCollision(playerPos.current.x + dx, playerPos.current.y)) playerPos.current.x += dx;
        if (dy !== 0 && !checkCollision(playerPos.current.x, playerPos.current.y + dy)) playerPos.current.y += dy;
      }

      context.clearRect(0, 0, canvas.width, canvas.height);

      // マップ描画 (fillRectに戻す)
      for (let y = 0; y < MAP_HEIGHT_IN_TILES; y++) {
        for (let x = 0; x < MAP_WIDTH_IN_TILES; x++) {
          context.fillStyle = tileMap[y][x] === 1 ? '#ddd' : '#333'; // 壁は#ddd、道は#333
          context.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        }
      }

      // NPC描画 (緑の四角に戻す)
      context.fillStyle = 'green';
      for (const npc of npcs) context.fillRect(npc.x, npc.y, PLAYER_WIDTH, PLAYER_HEIGHT);

      // プレイヤー描画 (青の四角に戻す)
      context.fillStyle = 'blue';
      context.fillRect(playerPos.current.x, playerPos.current.y, PLAYER_WIDTH, PLAYER_HEIGHT);

      animationFrameId = requestAnimationFrame(gameLoop);
    };
    gameLoop();

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      cancelAnimationFrame(animationFrameId);
    };
  }, [activeConversation]);

  return (
    <div style={{ position: 'relative', width: CANVAS_WIDTH, height: CANVAS_HEIGHT, margin: 'auto' }}>
      <canvas ref={canvasRef} />
      {activeConversation && (
        <DialogueBox
          history={activeConversation}
          onSendMessage={handlePlayerMessage}
          onClose={() => setActiveConversation(null)}
          isLoading={isLoading}
        />
      )}
    </div>
  );
};

export default Game;