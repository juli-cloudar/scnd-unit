// src/components/ScndDropGame.tsx
'use client';

import { useEffect, useRef, useState } from 'react';

const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;
const getCellSize = () => {
  if (typeof window === 'undefined') return 32;
  if (window.innerWidth < 640) return 24;
  if (window.innerWidth < 768) return 28;
  return 32;
};

// SCND UNIT Themed Tetrominos
const TETROMINOS = [
  { shape: [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]], color: '#FF4400', borderColor: '#CC3300', name: 'I', isBrand: true },
  { shape: [[0,0,0,0],[0,1,1,0],[0,1,1,0],[0,0,0,0]], color: '#FFD700', borderColor: '#CCAA00', name: 'O', isBrand: false },
  { shape: [[0,0,0,0],[0,1,0,0],[1,1,1,0],[0,0,0,0]], color: '#CC0000', borderColor: '#990000', name: 'T', isBrand: false },
  { shape: [[0,0,0,0],[0,1,1,0],[1,1,0,0],[0,0,0,0]], color: '#1A1A1A', borderColor: '#333333', name: 'S', isBrand: false },
  { shape: [[0,0,0,0],[1,1,0,0],[0,1,1,0],[0,0,0,0]], color: '#F5F5F5', borderColor: '#CCCCCC', name: 'Z', isBrand: false },
  { shape: [[0,0,0,0],[1,0,0,0],[1,1,1,0],[0,0,0,0]], color: '#0055A4', borderColor: '#004080', name: 'L', isBrand: false },
  { shape: [[0,0,0,0],[0,0,1,0],[1,1,1,0],[0,0,0,0]], color: '#00A86B', borderColor: '#008050', name: 'J', isBrand: false }
];

const POWERUPS = [
  { name: 'SLOW', color: '#00FFFF', effect: 'slow' },
  { name: 'BOMB', color: '#FF4444', effect: 'bomb' },
  { name: 'COLOR', color: '#FF00FF', effect: 'colorSwap' },
  { name: 'SCND', color: '#FF4400', effect: 'scndBlitz' }
];

interface Highscore {
  name: string;
  score: number;
}

export function ScndDropGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cellSize, setCellSize] = useState(32);
  const [board, setBoard] = useState<any[][]>(() => 
    Array(BOARD_HEIGHT).fill(null).map(() => Array(BOARD_WIDTH).fill(null))
  );
  const [currentPiece, setCurrentPiece] = useState<any>(null);
  const [pieceX, setPieceX] = useState(0);
  const [pieceY, setPieceY] = useState(0);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [gameOver, setGameOver] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  const [highscores, setHighscores] = useState<Highscore[]>([]);
  const [showNameInput, setShowNameInput] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [linesCleared, setLinesCleared] = useState(0);
  const [flashRow, setFlashRow] = useState<number | null>(null);
  const [popupScore, setPopupScore] = useState<{ score: number; x: number; y: number } | null>(null);
  const [combo, setCombo] = useState(0);
  const [hotStreak, setHotStreak] = useState(false);
  const [scndMode, setScndMode] = useState(false);
  const [newHighscoreGlow, setNewHighscoreGlow] = useState(false);
  const [particles, setParticles] = useState<{ x: number; y: number; life: number }[]>([]);
  const [powerUp, setPowerUp] = useState<any>(null);
  const [powerUpX, setPowerUpX] = useState(0);
  const [powerUpY, setPowerUpY] = useState(0);
  const [slowMode, setSlowMode] = useState(false);
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);
  const powerUpLoopRef = useRef<NodeJS.Timeout | null>(null);
  const [titlePulse, setTitlePulse] = useState(false);

  useEffect(() => {
    const handleResize = () => setCellSize(getCellSize());
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const getFallDelay = () => {
    let delay = Math.max(80, 300 - (level - 1) * 25);
    if (slowMode) delay = delay * 2;
    return delay;
  };

  useEffect(() => {
    const saved = localStorage.getItem('scnd_block_highscores');
    if (saved) setHighscores(JSON.parse(saved));
  }, []);

  useEffect(() => {
    if (isPlaying && !gameOver) {
      const interval = setInterval(() => {
        setTitlePulse(prev => !prev);
      }, 500);
      return () => clearInterval(interval);
    }
  }, [isPlaying, gameOver]);

  const startGame = () => {
    setBoard(Array(BOARD_HEIGHT).fill(null).map(() => Array(BOARD_WIDTH).fill(null)));
    setScore(0);
    setFinalScore(0);
    setLevel(1);
    setLinesCleared(0);
    setCombo(0);
    setHotStreak(false);
    setScndMode(false);
    setSlowMode(false);
    setGameOver(false);
    setShowNameInput(false);
    setParticles([]);
    spawnNewPiece();
    setIsPlaying(true);
    if (powerUpLoopRef.current) clearInterval(powerUpLoopRef.current);
    powerUpLoopRef.current = setInterval(spawnPowerUp, 15000);
  };

  const spawnPowerUp = () => {
    if (!isPlaying || gameOver) return;
    const randomPower = POWERUPS[Math.floor(Math.random() * POWERUPS.length)];
    setPowerUp(randomPower);
    setPowerUpX(Math.floor(Math.random() * BOARD_WIDTH));
    setPowerUpY(0);
  };

  const applyPowerUp = (effect: string) => {
    switch(effect) {
      case 'slow':
        setSlowMode(true);
        setTimeout(() => setSlowMode(false), 10000);
        break;
      case 'bomb':
        const newBoard = board.map(row => [...row]);
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const x = powerUpX + dx, y = powerUpY + dy;
            if (x >= 0 && x < BOARD_WIDTH && y >= 0 && y < BOARD_HEIGHT) {
              newBoard[y][x] = null;
            }
          }
        }
        setBoard(newBoard);
        break;
      case 'colorSwap':
        const colors = ['#FF4400', '#0055A4', '#FFD700', '#CC0000'];
        const newColorBoard = board.map(row => 
          row.map(cell => cell ? { ...cell, color: colors[Math.floor(Math.random() * colors.length)] } : null)
        );
        setBoard(newColorBoard);
        break;
      case 'scndBlitz':
        const blitzBoard = board.map(row => [...row]);
        for (let x = 0; x < BOARD_WIDTH; x++) {
          blitzBoard[BOARD_HEIGHT - 1][x] = null;
        }
        setBoard(blitzBoard);
        const bonus = 500;
        setScore(prev => prev + bonus);
        setPopupScore({ score: bonus, x: BOARD_WIDTH * cellSize / 2, y: 100 });
        setTimeout(() => setPopupScore(null), 500);
        break;
    }
    setPowerUp(null);
  };

  const spawnNewPiece = () => {
    const random = Math.floor(Math.random() * TETROMINOS.length);
    const piece = JSON.parse(JSON.stringify(TETROMINOS[random]));
    setCurrentPiece(piece);
    setPieceX(Math.floor((BOARD_WIDTH - piece.shape[0].length) / 2));
    setPieceY(0);
    if (collision(piece.shape, Math.floor((BOARD_WIDTH - piece.shape[0].length) / 2), 0)) {
      endGame();
    }
  };

  const endGame = () => {
    setGameOver(true);
    setFinalScore(score);
    setIsPlaying(false);
    if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    if (powerUpLoopRef.current) clearInterval(powerUpLoopRef.current);
    
    const isHighscore = highscores.length < 3 || score > highscores[2]?.score;
    if (score > 0 && isHighscore) {
      setShowNameInput(true);
      setNewHighscoreGlow(true);
      setTimeout(() => setNewHighscoreGlow(false), 2000);
    }
  };

  const collision = (shape: number[][], offsetX: number, offsetY: number) => {
    for (let y = 0; y < shape.length; y++) {
      for (let x = 0; x < shape[y].length; x++) {
        if (shape[y][x] !== 0) {
          const boardX = offsetX + x, boardY = offsetY + y;
          if (boardX < 0 || boardX >= BOARD_WIDTH || boardY >= BOARD_HEIGHT || boardY < 0) return true;
          if (boardY >= 0 && board[boardY]?.[boardX] !== null) return true;
        }
      }
    }
    return false;
  };

  const mergePiece = () => {
    if (!currentPiece) return;
    const newBoard = board.map(row => [...row]);
    for (let y = 0; y < currentPiece.shape.length; y++) {
      for (let x = 0; x < currentPiece.shape[y].length; x++) {
        if (currentPiece.shape[y][x] !== 0) {
          const boardX = pieceX + x, boardY = pieceY + y;
          if (boardY >= 0 && boardY < BOARD_HEIGHT && boardX >= 0 && boardX < BOARD_WIDTH) {
            newBoard[boardY][boardX] = { 
              color: currentPiece.color, 
              borderColor: currentPiece.borderColor,
              isBrand: currentPiece.isBrand
            };
          }
        }
      }
    }
    
    let rowsCleared = 0;
    const clearedRows: number[] = [];
    for (let row = BOARD_HEIGHT - 1; row >= 0; ) {
      if (newBoard[row].every(cell => cell !== null)) {
        clearedRows.push(row);
        setFlashRow(row);
        setTimeout(() => setFlashRow(null), 200);
        for (let x = 0; x < BOARD_WIDTH; x++) {
          for (let i = 0; i < 3; i++) {
            setParticles(prev => [...prev, { x: x * cellSize + cellSize/2, y: row * cellSize + cellSize/2, life: 1 }]);
          }
        }
        newBoard.splice(row, 1);
        newBoard.unshift(Array(BOARD_WIDTH).fill(null));
        rowsCleared++;
      } else row--;
    }
    
    const points = [0, 40, 100, 300, 1200];
    let addedScore = points[rowsCleared];
    let hasBrandBlock = false;
    
    for (const row of clearedRows) {
      if (newBoard[row]?.some(cell => cell?.isBrand)) hasBrandBlock = true;
    }
    
    if (rowsCleared > 0) {
      const newCombo = combo + 1;
      setCombo(newCombo);
      addedScore = Math.floor(addedScore * (1 + newCombo * 0.15));
      
      const hasScndColors = clearedRows.some(row => 
        newBoard[row]?.some(cell => cell?.color === '#FF4400' || cell?.color === '#1A1A1A')
      );
      if (hasScndColors) addedScore = Math.floor(addedScore * 2);
      
      if (newCombo >= 5 && !hotStreak) setHotStreak(true);
      if (newCombo >= 10 && !scndMode) {
        setScndMode(true);
        setTimeout(() => setScndMode(false), 10000);
      }
    } else {
      setCombo(0);
      setHotStreak(false);
    }
    
    if (hasBrandBlock) addedScore = Math.floor(addedScore * 1.5);
    
    const newScore = score + addedScore;
    setScore(newScore);
    
    const newLines = linesCleared + rowsCleared;
    setLinesCleared(newLines);
    const newLevel = Math.floor(newLines / 8) + 1;
    if (newLevel !== level) setLevel(newLevel);
    
    if (addedScore > 0) {
      setPopupScore({ score: addedScore, x: BOARD_WIDTH * cellSize / 2, y: BOARD_HEIGHT * cellSize / 2 - 50 });
      setTimeout(() => setPopupScore(null), 500);
    }
    
    setBoard(newBoard);
    spawnNewPiece();
  };

  useEffect(() => {
    if (particles.length > 0) {
      const interval = setInterval(() => {
        setParticles(prev => prev.filter(p => p.life > 0).map(p => ({ ...p, life: p.life - 0.05 })));
      }, 30);
      return () => clearInterval(interval);
    }
  }, [particles]);

  const movePiece = (dx: number, dy: number) => {
    if (!currentPiece || gameOver) return;
    if (!collision(currentPiece.shape, pieceX + dx, pieceY + dy)) {
      setPieceX(pieceX + dx);
      setPieceY(pieceY + dy);
    } else if (dy === 1) mergePiece();
  };

  const rotatePiece = () => {
    if (!currentPiece || gameOver) return;
    const rotated = currentPiece.shape[0].map((_: any, idx: number) => 
      currentPiece.shape.map((row: any[]) => row[idx]).reverse()
    );
    if (!collision(rotated, pieceX, pieceY)) {
      setCurrentPiece({ ...currentPiece, shape: rotated });
    }
  };

  // Touch-Controller für Handy
  const handleTouchLeft = () => movePiece(-1, 0);
  const handleTouchRight = () => movePiece(1, 0);
  const handleTouchDown = () => movePiece(0, 1);
  const handleTouchRotate = () => rotatePiece();

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (gameOver) return;
      switch (e.key) {
        case 'ArrowLeft': e.preventDefault(); movePiece(-1, 0); break;
        case 'ArrowRight': e.preventDefault(); movePiece(1, 0); break;
        case 'ArrowDown': e.preventDefault(); movePiece(0, 1); break;
        case 'ArrowUp': e.preventDefault(); rotatePiece(); break;
        default: break;
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [currentPiece, pieceX, pieceY, board, gameOver]);

  useEffect(() => {
    if (isPlaying && !gameOver) {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
      gameLoopRef.current = setInterval(() => movePiece(0, 1), getFallDelay());
    }
    return () => { if (gameLoopRef.current) clearInterval(gameLoopRef.current); };
  }, [isPlaying, gameOver, currentPiece, pieceX, pieceY, board, level, slowMode]);

  // Canvas zeichnen
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.width = BOARD_WIDTH * cellSize;
    canvas.height = BOARD_HEIGHT * cellSize;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = 'var(--bg-secondary)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.strokeStyle = '#FF4400';
    ctx.lineWidth = 3;
    ctx.strokeRect(2, 2, canvas.width - 4, canvas.height - 4);
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;
    ctx.strokeRect(1, 1, canvas.width - 2, canvas.height - 2);
    
    ctx.strokeStyle = '#FF44004D';
    ctx.lineWidth = 1;
    for (let x = 0; x <= BOARD_WIDTH; x++) {
      ctx.beginPath();
      ctx.moveTo(x * cellSize, 0);
      ctx.lineTo(x * cellSize, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y <= BOARD_HEIGHT; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * cellSize);
      ctx.lineTo(canvas.width, y * cellSize);
      ctx.stroke();
    }
    
    for (let y = 0; y < BOARD_HEIGHT; y++) {
      for (let x = 0; x < BOARD_WIDTH; x++) {
        const cell = board[y][x];
        if (cell) {
          ctx.fillStyle = cell.color;
          ctx.fillRect(x * cellSize, y * cellSize, cellSize - 1, cellSize - 1);
          ctx.fillStyle = cell.borderColor;
          ctx.fillRect(x * cellSize, y * cellSize, cellSize - 1, 2);
          ctx.fillRect(x * cellSize, y * cellSize, 2, cellSize - 1);
          if (cell.isBrand) {
            ctx.fillStyle = '#FFFFFF';
            ctx.font = `bold ${Math.max(10, cellSize * 0.45)}px monospace`;
            ctx.fillText('S', x * cellSize + cellSize * 0.35, y * cellSize + cellSize * 0.7);
          }
        }
        if (flashRow === y) {
          ctx.fillStyle = '#FF440080';
          ctx.fillRect(0, y * cellSize, canvas.width, cellSize);
        }
      }
    }
    
    if (powerUp && powerUpY < BOARD_HEIGHT) {
      ctx.fillStyle = powerUp.color;
      ctx.fillRect(powerUpX * cellSize, powerUpY * cellSize, cellSize - 1, cellSize - 1);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = `bold ${Math.max(10, cellSize * 0.4)}px monospace`;
      ctx.fillText(powerUp.name[0], powerUpX * cellSize + cellSize * 0.4, powerUpY * cellSize + cellSize * 0.7);
      setPowerUpY(prev => prev + 0.15);
      if (powerUpY >= BOARD_HEIGHT - 1) {
        setPowerUp(null);
      } else if (collision([[1]], powerUpX, Math.floor(powerUpY))) {
        applyPowerUp(powerUp.effect);
      }
    }
    
    if (currentPiece && !gameOver) {
      let ghostY = pieceY;
      while (!collision(currentPiece.shape, pieceX, ghostY + 1)) ghostY++;
      if (ghostY > pieceY) {
        ctx.globalAlpha = 0.3;
        for (let y = 0; y < currentPiece.shape.length; y++) {
          for (let x = 0; x < currentPiece.shape[y].length; x++) {
            if (currentPiece.shape[y][x] !== 0) {
              const boardX = pieceX + x, boardY = ghostY + y;
              if (boardY >= 0 && boardY < BOARD_HEIGHT && boardX >=0 && boardX < BOARD_WIDTH) {
                ctx.fillStyle = currentPiece.color;
                ctx.fillRect(boardX * cellSize, boardY * cellSize, cellSize - 1, cellSize - 1);
              }
            }
          }
        }
        ctx.globalAlpha = 1;
      }
      
      for (let y = 0; y < currentPiece.shape.length; y++) {
        for (let x = 0; x < currentPiece.shape[y].length; x++) {
          if (currentPiece.shape[y][x] !== 0) {
            const boardX = pieceX + x, boardY = pieceY + y;
            if (boardY >= 0 && boardY < BOARD_HEIGHT && boardX >=0 && boardX < BOARD_WIDTH) {
              ctx.fillStyle = currentPiece.color;
              ctx.fillRect(boardX * cellSize, boardY * cellSize, cellSize - 1, cellSize - 1);
              ctx.fillStyle = currentPiece.borderColor;
              ctx.fillRect(boardX * cellSize, boardY * cellSize, cellSize - 1, 2);
              ctx.fillRect(boardX * cellSize, boardY * cellSize, 2, cellSize - 1);
            }
          }
        }
      }
    }
    
    ctx.fillStyle = 'rgba(0,0,0,0.08)';
    for (let i = 0; i < canvas.height; i += 2) {
      ctx.fillRect(0, i, canvas.width, 1);
    }
    
    const gradient = ctx.createRadialGradient(canvas.width/2, canvas.height/2, 0, canvas.width/2, canvas.height/2, canvas.width/2);
    gradient.addColorStop(0, 'rgba(0,0,0,0)');
    gradient.addColorStop(1, 'rgba(0,0,0,0.3)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    for (const p of particles) {
      ctx.fillStyle = `rgba(255, 68, 0, ${p.life})`;
      ctx.fillRect(p.x - 2, p.y - 2, 4, 4);
    }
    
    const progress = ((linesCleared % 8) / 8) * canvas.width;
    ctx.fillStyle = '#1A1A1A';
    ctx.fillRect(0, canvas.height - 5, canvas.width, 4);
    ctx.fillStyle = '#FF4400';
    ctx.fillRect(0, canvas.height - 5, progress, 4);
    
    if (hotStreak) {
      ctx.font = `bold ${Math.max(12, cellSize * 0.5)}px monospace`;
      ctx.fillStyle = '#FF4400';
      ctx.fillText('🔥 HOT STREAK!', canvas.width / 2 - 60, 30);
    }
    if (scndMode) {
      ctx.font = `bold ${Math.max(14, cellSize * 0.6)}px monospace`;
      ctx.fillStyle = '#FF4400';
      ctx.fillText('⚡ SCND MODE!', canvas.width / 2 - 50, 60);
    }
    if (combo > 0) {
      ctx.font = `bold ${Math.max(12, cellSize * 0.5)}px monospace`;
      ctx.fillStyle = '#FF4400';
      ctx.fillText(`${combo}x COMBO!`, canvas.width - 70, 30);
    }
    if (popupScore) {
      ctx.font = `bold ${Math.max(16, cellSize * 0.75)}px monospace`;
      ctx.fillStyle = '#FF4400';
      ctx.fillText(`+${popupScore.score}`, popupScore.x - 20, popupScore.y);
    }
    ctx.shadowBlur = 0;
  }, [board, currentPiece, pieceX, pieceY, gameOver, flashRow, popupScore, combo, cellSize, hotStreak, scndMode, particles, powerUp, powerUpX, powerUpY, linesCleared]);

  const saveHighscore = () => {
    if (playerName.trim() === '') return;
    const newHighscores = [...highscores, { name: playerName, score: finalScore }];
    newHighscores.sort((a,b) => b.score - a.score);
    const top3 = newHighscores.slice(0,3);
    setHighscores(top3);
    localStorage.setItem('scnd_block_highscores', JSON.stringify(top3));
    setShowNameInput(false);
    setPlayerName('');
    setNewHighscoreGlow(false);
  };

  const rankIcon = (idx: number) => {
    if (idx === 0) return '🥇';
    if (idx === 1) return '🥈';
    return '🥉';
  };

  return (
    <div className={`my-6 md:my-12 p-3 md:p-6 bg-[var(--bg-secondary)] rounded-lg border-2 border-[#FF4400]/30 shadow-xl transition-all ${newHighscoreGlow ? 'shadow-[0_0_30px_#FF4400]' : ''}`}>
      <div className="relative">
        <div className="absolute inset-0 pointer-events-none rounded-lg overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-black/20"></div>
        </div>
        
        <div className="text-center mb-3 md:mb-4">
          <h3 className={`text-xl md:text-3xl font-bold tracking-tighter transition-all duration-300 ${titlePulse && isPlaying ? 'scale-110 text-[#FF4400]' : ''}`}>
            <span className="text-[#FF4400]">SCND</span>_<span className="text-[var(--text-primary)]">DROP</span>
          </h3>
          {slowMode && <p className="text-[8px] md:text-xs text-[#00FFFF] mt-1 animate-pulse">⏱️ TIME SLOW</p>}
        </div>

        <div className="flex flex-col md:flex-row gap-4 md:gap-8 justify-center items-center md:items-start">
          <div className="relative">
            <canvas ref={canvasRef} className="border-2 md:border-4 border-[#FF4400] shadow-lg shadow-[#FF4400]/20 rounded-sm" style={{ width: BOARD_WIDTH * cellSize, height: BOARD_HEIGHT * cellSize }} />
            
            {/* Touch-Controller für Handy */}
            {isPlaying && !gameOver && (
              <div className="absolute -bottom-20 left-0 right-0 flex justify-center gap-4 md:hidden mt-4">
                <button onTouchStart={handleTouchLeft} className="w-16 h-16 bg-black/70 border-2 border-[#FF4400] rounded-full text-white text-2xl font-bold active:bg-[#FF4400]/50">←</button>
                <button onTouchStart={handleTouchDown} className="w-16 h-16 bg-black/70 border-2 border-[#FF4400] rounded-full text-white text-2xl font-bold active:bg-[#FF4400]/50">↓</button>
                <button onTouchStart={handleTouchRight} className="w-16 h-16 bg-black/70 border-2 border-[#FF4400] rounded-full text-white text-2xl font-bold active:bg-[#FF4400]/50">→</button>
                <button onTouchStart={handleTouchRotate} className="w-16 h-16 bg-black/70 border-2 border-[#FF4400] rounded-full text-white text-2xl font-bold active:bg-[#FF4400]/50">↻</button>
              </div>
            )}
            
            {!isPlaying && !gameOver && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 md:gap-3 bg-black/70 backdrop-blur-sm rounded-sm">
                <button onClick={startGame} className="px-4 md:px-8 py-2 md:py-3 bg-[#FF4400] text-white font-bold uppercase tracking-wider rounded-sm text-xs md:text-base hover:bg-[#FF4400]/80 transition-all hover:scale-105 shadow-lg">
                  ▶ START
                </button>
              </div>
            )}
            {gameOver && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 md:gap-3 bg-black/70 backdrop-blur-sm rounded-sm">
                <div className="text-base md:text-2xl font-bold tracking-tighter mb-1 md:mb-2">
                  <span className="text-[#FF4400]">GAME</span>_<span className="text-white">OVER</span>
                </div>
                <div className="text-sm md:text-xl text-[#FF4400] font-bold mb-2">{finalScore} Punkte</div>
                <button onClick={startGame} className="px-4 md:px-6 py-1 md:py-2 bg-[#FF4400] text-white font-bold uppercase tracking-wider rounded-sm text-xs md:text-sm hover:bg-[#FF4400]/80 transition">NEUSTART</button>
              </div>
            )}
          </div>

          <div className="bg-[var(--bg-primary)] p-3 md:p-5 rounded-lg border border-[#FF4400]/30 min-w-[180px] md:min-w-[220px] w-full md:w-auto">
            <div className="text-center mb-3 md:mb-4 pb-2 md:pb-3 border-b border-[#FF4400]/30">
              <div className="text-[10px] md:text-xs text-[var(--text-secondary)] uppercase tracking-widest">SCORE</div>
              <div className="text-2xl md:text-4xl font-bold text-[#FF4400]">{gameOver ? finalScore : score}</div>
              <div className="text-[8px] md:text-xs text-[var(--text-secondary)] mt-1">LEVEL {level} · LINES {linesCleared}</div>
              {combo > 0 && <div className="text-[10px] md:text-xs text-[#FF4400] mt-1 animate-pulse">{combo}x COMBO!</div>}
              {hotStreak && <div className="text-[10px] md:text-xs text-[#FF4400] mt-1">🔥 HOT STREAK!</div>}
              {scndMode && <div className="text-[10px] md:text-xs text-[#FF4400] mt-1">⚡ SCND MODE!</div>}
            </div>
            
            <h4 className="font-bold text-xs md:text-sm uppercase tracking-widest text-[#FF4400] mb-2 md:mb-3">🏆 HIGHSCORES</h4>
            <ul className="space-y-1 md:space-y-2">
              {highscores.map((hs, idx) => (
                <li key={idx} className="flex justify-between items-center border-b border-[var(--border-color)] py-1">
                  <span className="flex items-center gap-1 md:gap-2">
                    <span className="text-sm md:text-lg">{rankIcon(idx)}</span>
                    <span className="text-xs md:text-base font-medium truncate max-w-[80px] md:max-w-none">{hs.name}</span>
                  </span>
                  <span className="text-xs md:text-base text-[#FF4400] font-bold">{hs.score}</span>
                </li>
              ))}
              {highscores.length === 0 && (
                <li className="text-center text-[10px] md:text-xs text-[var(--text-secondary)] py-2">— leer —</li>
              )}
            </ul>
            <div className="mt-3 md:mt-4 pt-2 md:pt-3 border-t border-[#FF4400]/30 text-center">
              <div className="text-[8px] md:text-[10px] text-[var(--text-secondary)] uppercase tracking-widest">CONTROLS</div>
              <div className="flex justify-center gap-2 md:gap-4 mt-1 md:mt-2 text-xs md:text-sm">
                <span>← → ↓</span>
                <span className="text-[#FF4400]">↑</span>
                <span className="text-[var(--text-secondary)]">DREHEN</span>
              </div>
              <div className="text-[8px] md:text-[10px] text-[#FF4400] mt-1">✨ POWER-UPS FALLEN!</div>
            </div>
          </div>
        </div>
      </div>

      {showNameInput && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--bg-secondary)] p-4 md:p-6 rounded-lg border-2 border-[#FF4400] max-w-sm w-full mx-4 shadow-2xl">
            <h3 className="text-lg md:text-2xl font-bold tracking-tighter mb-2">
              <span className="text-[#FF4400]">✨ NEW</span>_<span className="text-[var(--text-primary)]">HIGHSCORE</span>
            </h3>
            <p className="text-xs md:text-sm text-[var(--text-secondary)] mb-4">Punktzahl: <span className="text-[#FF4400] font-bold text-lg md:text-xl">{finalScore}</span></p>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              maxLength={15}
              className="w-full p-2 md:p-3 bg-[var(--bg-primary)] border-2 border-[#FF4400] rounded mb-4 text-sm md:text-base text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[#FF4400] uppercase tracking-wider"
              placeholder="DEIN SPITZNAME"
              autoFocus
            />
            <div className="flex gap-3">
              <button onClick={saveHighscore} className="flex-1 px-3 md:px-4 py-2 bg-[#FF4400] text-white font-bold uppercase tracking-wider rounded text-sm md:text-base hover:bg-[#FF4400]/80 transition">SPEICHERN</button>
              <button onClick={() => setShowNameInput(false)} className="flex-1 px-3 md:px-4 py-2 border border-gray-500 rounded hover:bg-gray-800 transition text-sm md:text-base">ABBRECHEN</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
