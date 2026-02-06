import React, { useState, useEffect, useRef } from 'react';
import { Gamepad2, Trophy, Play, RotateCcw, Medal } from 'lucide-react';
import { subscribeToHighScores, saveHighScore } from '../services/storeService';
import { HighScore } from '../types';
import { interact } from '../services/interactionService';

const GRID_SIZE = 20;
const SPEED = 100;

export const Arcade: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [snake, setSnake] = useState<{x: number, y: number}[]>([{x: 10, y: 10}]);
  const [food, setFood] = useState<{x: number, y: number}>({x: 15, y: 15});
  const [direction, setDirection] = useState<'UP' | 'DOWN' | 'LEFT' | 'RIGHT'>('RIGHT');
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [playerName, setPlayerName] = useState('');
  const [highScores, setHighScores] = useState<HighScore[]>([]);
  
  // Game loop ref to handle intervals
  const gameLoopRef = useRef<number | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToHighScores((data) => {
      setHighScores(data);
    });
    return () => unsubscribe();
  }, []);

  // Input Handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp':
          if (direction !== 'DOWN') setDirection('UP');
          break;
        case 'ArrowDown':
          if (direction !== 'UP') setDirection('DOWN');
          break;
        case 'ArrowLeft':
          if (direction !== 'RIGHT') setDirection('LEFT');
          break;
        case 'ArrowRight':
          if (direction !== 'LEFT') setDirection('RIGHT');
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [direction]);

  // Game Logic
  useEffect(() => {
    if (isPlaying && !gameOver) {
      gameLoopRef.current = window.setInterval(moveSnake, SPEED);
    } else {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    }
    return () => {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    };
  }, [isPlaying, gameOver, snake, direction]); // Dependencies crucial for closure

  const moveSnake = () => {
    const newSnake = [...snake];
    const head = { ...newSnake[0] };

    switch (direction) {
      case 'UP': head.y -= 1; break;
      case 'DOWN': head.y += 1; break;
      case 'LEFT': head.x -= 1; break;
      case 'RIGHT': head.x += 1; break;
    }

    // Check Wall Collision
    if (head.x < 0 || head.x >= 25 || head.y < 0 || head.y >= 20) {
      handleGameOver();
      return;
    }

    // Check Self Collision
    if (newSnake.some(segment => segment.x === head.x && segment.y === head.y)) {
      handleGameOver();
      return;
    }

    newSnake.unshift(head);

    // Check Food Collision
    if (head.x === food.x && head.y === food.y) {
      setScore(s => s + 10);
      interact(); // Haptic/Sound on eat
      generateFood();
    } else {
      newSnake.pop();
    }

    setSnake(newSnake);
  };

  const generateFood = () => {
    const x = Math.floor(Math.random() * 25);
    const y = Math.floor(Math.random() * 20);
    setFood({ x, y });
  };

  const handleGameOver = () => {
    setGameOver(true);
    setIsPlaying(false);
    interact(); // Sound on game over
  };

  const restartGame = () => {
    interact();
    setSnake([{x: 10, y: 10}]);
    setScore(0);
    setDirection('RIGHT');
    setGameOver(false);
    setIsPlaying(true);
    setPlayerName('');
  };

  const submitScore = async () => {
    if (!playerName.trim()) return;
    interact();
    await saveHighScore({
      name: playerName,
      score: score,
      date: new Date().toISOString()
    });
    setPlayerName('');
    // Optionally restart or just stay on screen
  };

  // Rendering
  useEffect(() => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, 500, 400);

    // Draw Background Grid (Subtle)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 25; i++) {
        ctx.beginPath(); ctx.moveTo(i * 20, 0); ctx.lineTo(i * 20, 400); ctx.stroke();
    }
    for (let i = 0; i <= 20; i++) {
        ctx.beginPath(); ctx.moveTo(0, i * 20); ctx.lineTo(500, i * 20); ctx.stroke();
    }

    // Draw Snake
    newSnakeDraw(ctx);

    // Draw Food
    ctx.fillStyle = '#ef4444'; // Red-500
    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.arc(food.x * 20 + 10, food.y * 20 + 10, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0; // Reset
    
    // Draw Eyes on Head
    // (Simplified)

  }, [snake, food]);

  const newSnakeDraw = (ctx: CanvasRenderingContext2D) => {
      snake.forEach((segment, i) => {
        ctx.fillStyle = i === 0 ? '#4ade80' : 'rgba(74, 222, 128, 0.8)'; // Green-400
        if (i === 0) {
            ctx.shadowColor = '#4ade80';
            ctx.shadowBlur = 10;
        } else {
            ctx.shadowBlur = 0;
        }
        
        // Draw rounded rect
        const x = segment.x * 20 + 1;
        const y = segment.y * 20 + 1;
        const w = 18;
        const h = 18;
        const r = 4;
        
        ctx.beginPath();
        ctx.roundRect(x, y, w, h, r);
        ctx.fill();
      });
  };

  return (
    <div className="p-4 md:p-8 h-full overflow-y-auto animate-fade-in flex flex-col">
       <div className="mb-6 lg:mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
                <h2 className="text-2xl lg:text-3xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
                    Retro Arcade <Gamepad2 className="text-indigo-600" />
                </h2>
                <p className="text-slate-600 font-medium mt-1 text-sm lg:text-base">Unwind with a quick game. Beat the high score!</p>
            </div>
            {/* Score Display */}
            <div className="bg-slate-900 text-green-400 font-mono px-6 py-3 rounded-xl text-2xl font-black shadow-lg border border-slate-700 tracking-wider">
                SCORE: {score.toString().padStart(4, '0')}
            </div>
        </div>

        <div className="flex flex-col xl:flex-row gap-8 flex-1 min-h-0 items-start">
            
            {/* GAME CONTAINER */}
            <div className="relative glass-panel rounded-2xl p-1 bg-slate-900 shadow-2xl border-slate-700 mx-auto xl:mx-0 shrink-0">
                <canvas 
                    ref={canvasRef} 
                    width={500} 
                    height={400} 
                    className="bg-slate-900 rounded-xl w-full max-w-[500px] h-auto cursor-none block"
                />
                
                {/* OVERLAY: START / GAME OVER */}
                {(!isPlaying || gameOver) && (
                    <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm rounded-xl flex flex-col items-center justify-center p-6 text-center z-10">
                        {gameOver ? (
                            <div className="animate-fade-in flex flex-col items-center gap-4 w-full max-w-xs">
                                <Trophy size={48} className="text-amber-500 animate-bounce" />
                                <h3 className="text-3xl font-black text-white uppercase tracking-widest text-shadow">Game Over</h3>
                                <p className="text-slate-300 font-mono">Final Score: {score}</p>
                                
                                <div className="w-full flex gap-2">
                                    <input 
                                        type="text" 
                                        maxLength={10}
                                        placeholder="ENTER INITIALS" 
                                        className="flex-1 bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white font-mono uppercase text-center focus:ring-2 focus:ring-green-500 outline-none"
                                        value={playerName}
                                        onChange={e => setPlayerName(e.target.value.toUpperCase())}
                                    />
                                    <button 
                                        onClick={submitScore}
                                        disabled={!playerName.trim()}
                                        className="bg-green-600 hover:bg-green-500 text-white font-bold px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        SAVE
                                    </button>
                                </div>

                                <button onClick={restartGame} className="mt-4 flex items-center gap-2 text-white hover:text-green-400 transition-colors">
                                    <RotateCcw size={20} /> Try Again
                                </button>
                            </div>
                        ) : (
                            <div className="animate-pulse flex flex-col items-center gap-6">
                                <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center border-2 border-slate-600 shadow-[0_0_20px_rgba(74,222,128,0.3)]">
                                     <Gamepad2 size={40} className="text-green-400" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-white uppercase tracking-widest mb-2">Neon Snake</h3>
                                    <p className="text-xs text-slate-400 font-mono">USE ARROW KEYS TO MOVE</p>
                                </div>
                                <button 
                                    onClick={restartGame}
                                    className="bg-green-500 hover:bg-green-400 text-slate-900 font-black py-3 px-8 rounded-full shadow-lg shadow-green-500/20 hover:scale-105 transition-all flex items-center gap-2"
                                >
                                    <Play size={20} fill="currentColor" /> START GAME
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* LEADERBOARD */}
            <div className="w-full xl:w-96 glass-panel rounded-2xl p-6 flex flex-col h-[400px]">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4">
                    <Medal size={20} className="text-amber-500" /> Hall of Fame
                </h3>
                
                <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                    {highScores.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400 opacity-60">
                             <Trophy size={32} className="mb-2" />
                             <p className="text-sm font-medium">Be the first legend!</p>
                        </div>
                    ) : (
                        highScores.map((entry, idx) => (
                            <div key={entry.id} className="flex items-center justify-between p-3 bg-white/40 rounded-xl border border-white/50 hover:bg-white/60 transition-colors group">
                                <div className="flex items-center gap-3">
                                    <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-black ${
                                        idx === 0 ? 'bg-amber-100 text-amber-600' :
                                        idx === 1 ? 'bg-slate-200 text-slate-600' :
                                        idx === 2 ? 'bg-orange-100 text-orange-700' :
                                        'bg-white text-slate-400'
                                    }`}>
                                        {idx + 1}
                                    </span>
                                    <div>
                                        <p className="font-bold text-slate-800 text-sm leading-tight">{entry.name}</p>
                                        <p className="text-[10px] text-slate-500">{new Date(entry.date).toLocaleDateString()}</p>
                                    </div>
                                </div>
                                <span className="font-mono font-bold text-indigo-600">{entry.score}</span>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    </div>
  );
};