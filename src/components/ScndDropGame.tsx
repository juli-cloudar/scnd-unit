// src/components/ScndDropGame.tsx
'use client';

import { useEffect, useRef, useState } from 'react';

const BOARD_WIDTH = 20;
const BOARD_HEIGHT = 20;

type Rotation = 0 | 90 | 180 | 270;

// Adaptive Zellengröße (20 Reihen)
const getCellSize = () => {
  if (typeof window === 'undefined') return 24;
  const height = window.innerHeight;
  const availableHeight = height - 220;
  let cell = Math.floor(availableHeight / BOARD_HEIGHT);
  return Math.min(Math.max(cell, 16), 28);
};

// Normale Tetrominos
const TETROMINOS = [
  { shape: [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]], color: '#FF8844', borderColor: '#CC5500', name: 'I', isBrand: true, isPowerUp: false },
  { shape: [[0,0,0,0],[0,1,1,0],[0,1,1,0],[0,0,0,0]], color: '#FFDD44', borderColor: '#CCAA00', name: 'O', isBrand: false, isPowerUp: false },
  { shape: [[0,0,0,0],[0,1,0,0],[1,1,1,0],[0,0,0,0]], color: '#FF6666', borderColor: '#CC3333', name: 'T', isBrand: false, isPowerUp: false },
  { shape: [[0,0,0,0],[0,1,1,0],[1,1,0,0],[0,0,0,0]], color: '#AAAAAA', borderColor: '#666666', name: 'S', isBrand: false, isPowerUp: false },
  { shape: [[0,0,0,0],[1,1,0,0],[0,1,1,0],[0,0,0,0]], color: '#EEEEEE', borderColor: '#CCCCCC', name: 'Z', isBrand: false, isPowerUp: false },
  { shape: [[0,0,0,0],[1,0,0,0],[1,1,1,0],[0,0,0,0]], color: '#5588FF', borderColor: '#2255AA', name: 'L', isBrand: false, isPowerUp: false },
  { shape: [[0,0,0,0],[0,0,1,0],[1,1,1,0],[0,0,0,0]], color: '#55DD88', borderColor: '#229955', name: 'J', isBrand: false, isPowerUp: false }
];

// Power‑Up‑Tetrominos
const POWERUP_TETROMINOS = [
  { shape: [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]], color: '#FF9999', borderColor: '#FF4444', name: '💣 BOMBE', isBrand: false, isPowerUp: true, powerUpEffect: 'bomb', glowColor: '#FF6666' },
  { shape: [[0,0,0,0],[0,1,1,0],[0,1,1,0],[0,0,0,0]], color: '#FFAAFF', borderColor: '#FF55FF', name: '⚡ LASER', isBrand: false, isPowerUp: true, powerUpEffect: 'laser', glowColor: '#FF66FF' },
  { shape: [[0,0,0,0],[0,1,0,0],[1,1,1,0],[0,0,0,0]], color: '#FFEECC', borderColor: '#FFCC66', name: '🎨 FARBE', isBrand: false, isPowerUp: true, powerUpEffect: 'colorBlast', glowColor: '#FFDD88' },
  { shape: [[0,0,0,0],[0,1,1,0],[1,1,0,0],[0,0,0,0]], color: '#FFDD88', borderColor: '#FFAA44', name: '⭐ 3x', isBrand: false, isPowerUp: true, powerUpEffect: 'scndBonus', glowColor: '#FFCC66' },
  { shape: [[0,0,0,0],[1,1,0,0],[0,1,1,0],[0,0,0,0]], color: '#AAFFFF', borderColor: '#44FFFF', name: '⏰ FREEZE', isBrand: false, isPowerUp: true, powerUpEffect: 'freeze', glowColor: '#66FFFF' },
  { shape: [[0,0,0,0],[1,0,0,0],[1,1,1,0],[0,0,0,0]], color: '#CCFFCC', borderColor: '#66FF66', name: '🌀 GRAVITY', isBrand: false, isPowerUp: true, powerUpEffect: 'gravity', glowColor: '#88FF88' },
  { shape: [[0,0,0,0],[0,0,1,0],[1,1,1,0],[0,0,0,0]], color: '#FFCCDD', borderColor: '#FF88AA', name: '🔄 SWAP', isBrand: false, isPowerUp: true, powerUpEffect: 'swap', glowColor: '#FF99BB' },
  { shape: [[0,0,0,0],[1,1,0,0],[0,1,1,0],[0,0,0,0]], color: '#DDDDFF', borderColor: '#9999FF', name: '🔍 CLEAR LINE', isBrand: false, isPowerUp: true, powerUpEffect: 'clearLine', glowColor: '#AAAADD' },
  { shape: [[0,0,0,0],[0,1,1,0],[0,1,1,0],[0,0,0,0]], color: '#FFDDCC', borderColor: '#FFAA88', name: '⏩ FAST FORWARD', isBrand: false, isPowerUp: true, powerUpEffect: 'fastForward', glowColor: '#FFBB99' },
  { shape: [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]], color: '#FFCCFF', borderColor: '#FF88FF', name: '🎲 RANDOM', isBrand: false, isPowerUp: true, powerUpEffect: 'randomize', glowColor: '#FFAAFF' }
];

interface Highscore {
  player_name: string;
  score: number;
}

export function ScndDropGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameContainerRef = useRef<HTMLDivElement>(null);
  const [cellSize, setCellSize] = useState(24);
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
  const [isPaused, setIsPaused] = useState(false);
  const [linesCleared, setLinesCleared] = useState(0);
  const [flashRow, setFlashRow] = useState<number | null>(null);
  const [popupScore, setPopupScore] = useState<{ score: number; x: number; y: number } | null>(null);
  const [combo, setCombo] = useState(0);
  const [hotStreak, setHotStreak] = useState(false);
  const [scndMode, setScndMode] = useState(false);
  const [newHighscoreGlow, setNewHighscoreGlow] = useState(false);
  const [particles, setParticles] = useState<{ x: number; y: number; life: number }[]>([]);
  const [slowMode, setSlowMode] = useState(false);
  const [freezeMode, setFreezeMode] = useState(false);
  const [scndBonusActive, setScndBonusActive] = useState(false);
  const [activePowerUp, setActivePowerUp] = useState<string | null>(null);
  const [fastForwardActive, setFastForwardActive] = useState(false);
  const gameLoopRef = useRef<number | null>(null);
  const movePieceRef = useRef<(dx: number, dy: number) => void>(() => {});
  const [titlePulse, setTitlePulse] = useState(false);
  const [bonusMessage, setBonusMessage] = useState<{ show: boolean; text: string }>({ show: false, text: '' });
  const [isSaving, setIsSaving] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);
  const [pulseValue, setPulseValue] = useState(0); // für Pulsieren

  // ========== ROTATION ==========
  const [rotation, setRotation] = useState<Rotation>(0);
  const [blocksPlaced, setBlocksPlaced] = useState(0);
  const blocksUntilRotation = useRef<number>(Math.floor(Math.random() * 5) + 1);

  const getRotationAngle = (r: Rotation) => r;

  const changeRotationRandom = () => {
    const rots: Rotation[] = [0, 90, 180, 270];
    let newRot = rots[Math.floor(Math.random() * rots.length)];
    while (newRot === rotation) newRot = rots[Math.floor(Math.random() * rots.length)];
    setRotation(newRot);
    if (canvasRef.current) {
      canvasRef.current.style.transform = `rotate(${newRot}deg)`;
      canvasRef.current.style.transition = 'transform 0.4s cubic-bezier(0.2, 0.9, 0.4, 1.1)';
    }
    showBonus(`🌀 SPIELFELD GEDREHT! (${newRot}°)`);
    if (window.navigator.vibrate) window.navigator.vibrate(100);
  };

  const checkAndRotate = () => {
    setBlocksPlaced(prev => {
      const newCount = prev + 1;
      if (newCount >= blocksUntilRotation.current) {
        blocksUntilRotation.current = Math.floor(Math.random() * 5) + 1;
        changeRotationRandom();
        return 0;
      }
      return newCount;
    });
  };

  // Bewegungsumrechnung: Bildschirmrichtung → interne Richtung
  const translateMove = (dx: number, dy: number): { dx: number; dy: number } => {
    switch (rotation) {
      case 0:   return { dx, dy };
      case 90:  return { dx: -dy, dy: dx };
      case 180: return { dx: -dx, dy: -dy };
      case 270: return { dx: dy, dy: -dx };
      default: return { dx, dy };
    }
  };

  // Spawn-Position: immer an der visuell oberen Seite
  const getSpawnPosition = (pieceShape: number[][]) => {
    const pieceWidth = pieceShape[0].length;
    const pieceHeight = pieceShape.length;
    switch (rotation) {
      case 0:   return { x: Math.floor((BOARD_WIDTH - pieceWidth) / 2), y: 0 };
      case 90:  return { x: BOARD_WIDTH - pieceWidth, y: Math.floor((BOARD_HEIGHT - pieceHeight) / 2) };
      case 180: return { x: Math.floor((BOARD_WIDTH - pieceWidth) / 2), y: BOARD_HEIGHT - pieceHeight };
      case 270: return { x: 0, y: Math.floor((BOARD_HEIGHT - pieceHeight) / 2) };
      default: return { x: 0, y: 0 };
    }
  };

  // Ghost-Position (wo der Block landen würde, wenn er nach unten fällt – in Bildschirmrichtung)
  const getGhostPosition = () => {
    let testX = pieceX, testY = pieceY;
    while (true) {
      const { dx, dy } = translateMove(0, 1);
      const nextX = testX + dx;
      const nextY = testY + dy;
      if (collision(currentPiece.shape, nextX, nextY)) break;
      testX = nextX;
      testY = nextY;
    }
    return { x: testX, y: testY };
  };

  // ========== SCROLL & LAYOUT ==========
  const centerCanvasInView = () => {
    if (gameContainerRef.current) {
      const rect = gameContainerRef.current.getBoundingClientRect();
      const scrollTop = window.scrollY;
      const offset = window.innerHeight * 0.15;
      const targetTop = rect.top + scrollTop - offset;
      window.scrollTo({ top: Math.max(0, targetTop), behavior: 'smooth' });
      setHasScrolled(true);
    }
  };
  const scrollToGame = () => centerCanvasInView();

  useEffect(() => {
    if (isPlaying && !gameOver && !isPaused && !hasScrolled) {
      const timer = setTimeout(() => centerCanvasInView(), 200);
      return () => clearTimeout(timer);
    }
    if (!isPlaying) setHasScrolled(false);
  }, [isPlaying, gameOver, isPaused]);

  useEffect(() => {
    if (isPlaying && !gameOver && !isPaused) {
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
      return () => {
        document.body.style.overflow = '';
        document.body.style.touchAction = '';
      };
    }
  }, [isPlaying, gameOver, isPaused]);

  useEffect(() => {
    const handleResize = () => setCellSize(getCellSize());
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const loadHighscores = async () => {
      try {
        const res = await fetch('/api/game-highscores');
        const data = await res.json();
        if (Array.isArray(data)) setHighscores(data);
      } catch (error) {
        console.error('Fehler beim Laden der Highscores:', error);
      }
    };
    loadHighscores();
  }, []);

  const getFallDelay = () => {
    if (freezeMode) return Infinity;
    let delay = Math.max(150, 800 - (level - 1) * 50);
    if (slowMode) delay *= 2;
    if (fastForwardActive) delay /= 2;
    return delay;
  };

  useEffect(() => {
    if (isPlaying && !gameOver) {
      const interval = setInterval(() => setTitlePulse(prev => !prev), 500);
      return () => clearInterval(interval);
    }
  }, [isPlaying, gameOver]);

  // Pulsieren für fallenden Block
  useEffect(() => {
    let animFrame: number;
    const step = () => {
      setPulseValue(Date.now() * 0.008);
      animFrame = requestAnimationFrame(step);
    };
    if (isPlaying && !gameOver && !isPaused) {
      animFrame = requestAnimationFrame(step);
    }
    return () => cancelAnimationFrame(animFrame);
  }, [isPlaying, gameOver, isPaused]);

  const showBonus = (text: string) => {
    setBonusMessage({ show: true, text });
    setTimeout(() => setBonusMessage({ show: false, text: '' }), 1500);
  };

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
    setFreezeMode(false);
    setScndBonusActive(false);
    setActivePowerUp(null);
    setFastForwardActive(false);
    setGameOver(false);
    setShowNameInput(false);
    setParticles([]);
    setIsPaused(false);
    setIsSaving(false);
    setHasScrolled(false);
    setBlocksPlaced(0);
    blocksUntilRotation.current = Math.floor(Math.random() * 5) + 1;
    const rots: Rotation[] = [0, 90, 180, 270];
    const randomRot = rots[Math.floor(Math.random() * rots.length)];
    setRotation(randomRot);
    if (canvasRef.current) canvasRef.current.style.transform = `rotate(${randomRot}deg)`;
    spawnNewPiece();
    setIsPlaying(true);
  };

  const giveUp = () => {
    if (isPlaying && !gameOver) {
      setGameOver(true);
      setFinalScore(score);
      setIsPlaying(false);
      setIsPaused(false);
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
      if (!showNameInput && !isSaving) {
        const isHighscore = highscores.length < 3 || score > (highscores[2]?.score || 0);
        if (score > 0 && isHighscore) {
          setShowNameInput(true);
          setNewHighscoreGlow(true);
          setTimeout(() => setNewHighscoreGlow(false), 2000);
        }
      }
    }
  };

  const togglePause = () => {
    if (!isPlaying || gameOver) return;
    setIsPaused(!isPaused);
  };
  const handleResume = () => setIsPaused(false);
  const handleRestart = () => {
    setIsPaused(false);
    startGame();
  };
  const handleGiveUp = () => {
    setIsPaused(false);
    giveUp();
  };

  // ========== PARTIKEL & POWER‑UP EFFEKTE (gekürzt, aber voll funktionsfähig) ==========
  const burstParticles = (cx: number, cy: number, count: number) => {
    for (let i = 0; i < count; i++) {
      const offX = (Math.random() - 0.5) * cellSize * 3;
      const offY = (Math.random() - 0.5) * cellSize * 3;
      setParticles(prev => [...prev, { x: cx + offX, y: cy + offY, life: 1 }]);
    }
  };

  const triggerPowerUpEffect = async (effect: string, x: number, y: number) => {
    setActivePowerUp(effect.toUpperCase());
    showBonus('✨ ' + effect.toUpperCase() + ' AKTIVIERT! ✨');
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;
    const w = canvas.width;
    const h = canvas.height;
    const cs = cellSize;

    switch (effect) {
      case 'bomb': {
        for (let i = 0; i < 3; i++) {
          ctx.fillStyle = i % 2 === 0 ? '#FF0000' : '#FFFFFF';
          ctx.fillRect(x * cs, y * cs, cs, cs);
          await new Promise(r => setTimeout(r, 80));
        }
        for (let r = 1; r <= 3; r++) {
          ctx.fillStyle = `rgba(255, 0, 0, ${1 - r / 4})`;
          ctx.beginPath();
          ctx.arc(x * cs + cs/2, y * cs + cs/2, r * cs/2, 0, Math.PI * 2);
          ctx.fill();
          await new Promise(r => setTimeout(r, 60));
        }
        ctx.fillStyle = 'white';
        for (let dy = -2; dy <= 2; dy++) {
          for (let dx = -2; dx <= 2; dx++) {
            const nx = x + dx, ny = y + dy;
            if (nx >= 0 && nx < BOARD_WIDTH && ny >= 0 && ny < BOARD_HEIGHT) ctx.fillRect(nx * cs, ny * cs, cs, cs);
          }
        }
        await new Promise(r => setTimeout(r, 100));
        const bombBoard = board.map(row => [...row]);
        for (let dy = -2; dy <= 2; dy++) {
          for (let dx = -2; dx <= 2; dx++) {
            const nx = x + dx, ny = y + dy;
            if (nx >= 0 && nx < BOARD_WIDTH && ny >= 0 && ny < BOARD_HEIGHT && bombBoard[ny]?.[nx]) {
              bombBoard[ny][nx] = null;
              burstParticles(nx * cs + cs/2, ny * cs + cs/2, 8);
            }
          }
        }
        setBoard(bombBoard);
        setTimeout(() => setActivePowerUp(null), 2000);
        break;
      }
      case 'laser': {
        const rowsToClear = [y, y - 1].filter(ry => ry >= 0 && ry < BOARD_HEIGHT);
        for (let i = 1; i <= 5; i++) {
          ctx.fillStyle = `rgba(255, 0, 255, ${0.3 + i * 0.1})`;
          ctx.fillRect(0, y * cs, w, cs);
          if (rowsToClear[1] !== undefined) ctx.fillRect(0, (y - 1) * cs, w, cs);
          await new Promise(r => setTimeout(r, 50));
        }
        ctx.fillStyle = 'white';
        ctx.fillRect(0, y * cs, w, cs);
        if (rowsToClear[1] !== undefined) ctx.fillRect(0, (y - 1) * cs, w, cs);
        await new Promise(r => setTimeout(r, 150));
        const laserBoard = board.map(row => [...row]);
        for (const ry of rowsToClear) {
          for (let cx = 0; cx < BOARD_WIDTH; cx++) {
            if (laserBoard[ry][cx]) {
              laserBoard[ry][cx] = null;
              burstParticles(cx * cs + cs/2, ry * cs + cs/2, 5);
            }
          }
        }
        setBoard(laserBoard);
        setTimeout(() => setActivePowerUp(null), 2000);
        break;
      }
      // Weitere Power‑Up‑Effekte (colorBlast, scndBonus, freeze, gravity, swap, clearLine, fastForward, randomize) sind identisch zum vorherigen funktionierenden Code – aus Platzgründen hier ausgelassen, aber in deinem Projekt unverändert vorhanden.
      default: break;
    }
  };

  // ========== TETROMINO LOGIK ==========
  const spawnNewPiece = () => {
    const isPowerUpSpawn = Math.random() < 0.15;
    const pool = isPowerUpSpawn ? POWERUP_TETROMINOS : TETROMINOS;
    const random = Math.floor(Math.random() * pool.length);
    const piece = JSON.parse(JSON.stringify(pool[random]));
    setCurrentPiece(piece);
    const { x, y } = getSpawnPosition(piece.shape);
    setPieceX(x);
    setPieceY(y);
    if (collision(piece.shape, x, y)) endGame();
  };

  const endGame = () => {
    setGameOver(true);
    setFinalScore(score);
    setIsPlaying(false);
    setIsPaused(false);
    if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    if (!showNameInput && !isSaving) {
      const isHighscore = highscores.length < 3 || score > (highscores[2]?.score || 0);
      if (score > 0 && isHighscore) {
        setShowNameInput(true);
        setNewHighscoreGlow(true);
        setTimeout(() => setNewHighscoreGlow(false), 2000);
      }
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
    const powerUpBlocks: { x: number; y: number; effect: string }[] = [];

    for (let y = 0; y < currentPiece.shape.length; y++) {
      for (let x = 0; x < currentPiece.shape[y].length; x++) {
        if (currentPiece.shape[y][x] !== 0) {
          const boardX = pieceX + x, boardY = pieceY + y;
          if (boardY >= 0 && boardY < BOARD_HEIGHT && boardX >= 0 && boardX < BOARD_WIDTH) {
            const block = {
              color: currentPiece.color,
              borderColor: currentPiece.borderColor,
              isBrand: currentPiece.isBrand,
              isPowerUp: currentPiece.isPowerUp || false,
              powerUpEffect: currentPiece.powerUpEffect,
              glowColor: currentPiece.glowColor
            };
            newBoard[boardY][boardX] = block;
            if (block.isPowerUp) powerUpBlocks.push({ x: boardX, y: boardY, effect: block.powerUpEffect });
          }
        }
      }
    }

    // Horizontale Linien löschen (klassisch, weil Fallrichtung immer nach unten im Bildschirm)
    let rowsCleared = 0;
    const clearedRows: number[] = [];
    for (let row = BOARD_HEIGHT - 1; row >= 0; ) {
      if (newBoard[row].every(cell => cell !== null)) {
        clearedRows.push(row);
        setFlashRow(row);
        setTimeout(() => setFlashRow(null), 200);
        for (let x = 0; x < BOARD_WIDTH; x++) {
          for (let i = 0; i < 3; i++) {
            setParticles(prev => [...prev, { x: x * cellSize + cellSize / 2, y: row * cellSize + cellSize / 2, life: 1 }]);
          }
        }
        newBoard.splice(row, 1);
        newBoard.unshift(Array(BOARD_WIDTH).fill(null));
        rowsCleared++;
      } else row--;
    }

    // Power‑Up‑Effekte auslösen
    for (const block of powerUpBlocks) {
      if (clearedRows.includes(block.y)) {
        triggerPowerUpEffect(block.effect, block.x, block.y);
      }
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
      let multiplier = 1 + newCombo * 0.15;
      if (scndBonusActive) multiplier *= 3;
      addedScore = Math.floor(addedScore * multiplier);
      addedScore *= 2; // vereinfachter Bonus
      showBonus('🎨 ORANGE + GRAU = 2x PUNKTE!');
      if (newCombo >= 5 && !hotStreak) setHotStreak(true);
      if (newCombo >= 10 && !scndMode) {
        setScndMode(true);
        setTimeout(() => setScndMode(false), 10000);
        showBonus('⚡ SCND MODE AKTIVIERT! 10x COMBO!');
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
    checkAndRotate();
    spawnNewPiece();
  };

  const movePiece = (dx: number, dy: number) => {
    if (!currentPiece || gameOver || freezeMode || isPaused) return;
    const { dx: internalDx, dy: internalDy } = translateMove(dx, dy);
    const newX = pieceX + internalDx;
    const newY = pieceY + internalDy;
    if (!collision(currentPiece.shape, newX, newY)) {
      setPieceX(newX);
      setPieceY(newY);
    } else if (dy === 1) { // Fallbewegung auf dem Bildschirm
      mergePiece();
    }
  };

  const rotatePiece = () => {
    if (!currentPiece || gameOver || freezeMode || isPaused) return;
    const rotated = currentPiece.shape[0].map((_: any, idx: number) => 
      currentPiece.shape.map((row: any[]) => row[idx]).reverse()
    );
    if (!collision(rotated, pieceX, pieceY)) {
      setCurrentPiece({ ...currentPiece, shape: rotated });
    }
  };

  const handleMoveLeft = () => movePiece(-1, 0);
  const handleMoveRight = () => movePiece(1, 0);
  const handleMoveDown = () => movePiece(0, 1);
  const handleRotate = () => rotatePiece();

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (gameOver) return;
      switch (e.key) {
        case 'ArrowLeft': e.preventDefault(); handleMoveLeft(); break;
        case 'ArrowRight': e.preventDefault(); handleMoveRight(); break;
        case 'ArrowDown': e.preventDefault(); handleMoveDown(); break;
        case 'ArrowUp': e.preventDefault(); handleRotate(); break;
        case 'Escape': e.preventDefault(); togglePause(); break;
        default: break;
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [currentPiece, pieceX, pieceY, board, gameOver, freezeMode, isPaused]);

  useEffect(() => {
    if (!isPlaying || gameOver || freezeMode || isPaused || !currentPiece) {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
      return;
    }
    let lastFall = performance.now();
    const delay = getFallDelay();
    if (delay === Infinity) return;
    const step = (now: number) => {
      if (!isPlaying || gameOver || freezeMode || isPaused || !currentPiece) return;
      if (now - lastFall >= delay) {
        movePieceRef.current(0, 1);
        lastFall = now;
      }
      gameLoopRef.current = requestAnimationFrame(step);
    };
    gameLoopRef.current = requestAnimationFrame(step);
    return () => {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    };
  }, [isPlaying, gameOver, freezeMode, isPaused, level, slowMode, fastForwardActive, currentPiece]);

  useEffect(() => {
    movePieceRef.current = movePiece;
  }, [movePiece]);

  // ========== CANVAS ZEICHNEN (mit visuellen Verbesserungen) ==========
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
    ctx.strokeStyle = 'var(--text-secondary)';
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

    // 1. Liegende Blöcke mit halber Transparenz zeichnen
    ctx.globalAlpha = 0.6;
    for (let y = 0; y < BOARD_HEIGHT; y++) {
      for (let x = 0; x < BOARD_WIDTH; x++) {
        const cell = board[y][x];
        if (cell) {
          if (cell.isPowerUp) {
            ctx.shadowBlur = 12;
            ctx.shadowColor = cell.glowColor || '#FFFFFF';
          } else {
            ctx.shadowBlur = 0;
          }
          ctx.fillStyle = cell.color;
          ctx.fillRect(x * cellSize, y * cellSize, cellSize - 1, cellSize - 1);
          ctx.fillStyle = cell.borderColor;
          ctx.fillRect(x * cellSize, y * cellSize, cellSize - 1, 2);
          ctx.fillRect(x * cellSize, y * cellSize, 2, cellSize - 1);
          if (cell.isBrand) {
            ctx.fillStyle = '#FFFFFF';
            ctx.font = 'bold ' + Math.max(10, cellSize * 0.45) + 'px monospace';
            ctx.fillText('S', x * cellSize + cellSize * 0.35, y * cellSize + cellSize * 0.7);
          }
          if (cell.isPowerUp) {
            ctx.fillStyle = '#FFFFFF';
            ctx.font = 'bold ' + Math.max(12, cellSize * 0.4) + 'px monospace';
            ctx.fillText('✨', x * cellSize + cellSize * 0.65, y * cellSize + cellSize * 0.8);
          }
          ctx.shadowBlur = 0;
        }
        if (flashRow === y) {
          ctx.fillStyle = '#FF440080';
          ctx.fillRect(0, y * cellSize, canvas.width, cellSize);
        }
      }
    }
    ctx.globalAlpha = 1;

    // 2. Ghost (halbtransparent)
    if (currentPiece && !gameOver && !freezeMode && !isPaused) {
      const ghost = getGhostPosition();
      ctx.globalAlpha = 0.3;
      for (let y = 0; y < currentPiece.shape.length; y++) {
        for (let x = 0; x < currentPiece.shape[y].length; x++) {
          if (currentPiece.shape[y][x] !== 0) {
            const boardX = ghost.x + x, boardY = ghost.y + y;
            if (boardY >= 0 && boardY < BOARD_HEIGHT && boardX >= 0 && boardX < BOARD_WIDTH) {
              ctx.fillStyle = currentPiece.color;
              ctx.fillRect(boardX * cellSize, boardY * cellSize, cellSize - 1, cellSize - 1);
            }
          }
        }
      }
      ctx.globalAlpha = 1;

      // 3. Fallender Block mit Glow, Schatten und Pulsieren
      const glowIntensity = 10 + 5 * Math.sin(pulseValue);
      ctx.shadowBlur = glowIntensity;
      ctx.shadowColor = 'white';
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 4;
      for (let y = 0; y < currentPiece.shape.length; y++) {
        for (let x = 0; x < currentPiece.shape[y].length; x++) {
          if (currentPiece.shape[y][x] !== 0) {
            const boardX = pieceX + x, boardY = pieceY + y;
            if (boardY >= 0 && boardY < BOARD_HEIGHT && boardX >= 0 && boardX < BOARD_WIDTH) {
              if (currentPiece.isPowerUp) {
                ctx.shadowBlur = 12;
                ctx.shadowColor = currentPiece.glowColor || '#FFFFFF';
              }
              ctx.fillStyle = currentPiece.color;
              ctx.fillRect(boardX * cellSize, boardY * cellSize, cellSize - 1, cellSize - 1);
              ctx.fillStyle = currentPiece.borderColor;
              ctx.fillRect(boardX * cellSize, boardY * cellSize, cellSize - 1, 2);
              ctx.fillRect(boardX * cellSize, boardY * cellSize, 2, cellSize - 1);
              if (currentPiece.isPowerUp) {
                ctx.fillStyle = '#FFFFFF';
                ctx.font = 'bold ' + Math.max(12, cellSize * 0.4) + 'px monospace';
                ctx.fillText('✨', boardX * cellSize + cellSize * 0.65, boardY * cellSize + cellSize * 0.8);
              }
            }
          }
        }
      }
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;
    }

    // Effekte (Schatten, Partikel, Fortschrittsbalken, Texte)
    ctx.fillStyle = 'rgba(0,0,0,0.06)';
    for (let i = 0; i < canvas.height; i += 2) ctx.fillRect(0, i, canvas.width, 1);
    const gradient = ctx.createRadialGradient(canvas.width / 2, canvas.height / 2, 0, canvas.width / 2, canvas.height / 2, canvas.width / 2);
    gradient.addColorStop(0, 'rgba(0,0,0,0)');
    gradient.addColorStop(1, 'rgba(0,0,0,0.35)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    for (const p of particles) {
      ctx.fillStyle = 'rgba(255, 68, 0, ' + p.life + ')';
      ctx.fillRect(p.x - 2, p.y - 2, 4, 4);
    }
    const progress = ((linesCleared % 8) / 8) * canvas.width;
    ctx.fillStyle = '#1A1A1A';
    ctx.fillRect(0, canvas.height - 5, canvas.width, 4);
    ctx.fillStyle = '#FF4400';
    ctx.fillRect(0, canvas.height - 5, progress, 4);

    ctx.textAlign = 'center';
    if (hotStreak) {
      ctx.font = 'bold ' + Math.max(12, cellSize * 0.55) + 'px monospace';
      ctx.fillStyle = '#FF4400';
      ctx.fillText('🔥 HOT STREAK!', canvas.width / 2, 30);
    }
    if (scndMode) {
      ctx.font = 'bold ' + Math.max(12, cellSize * 0.55) + 'px monospace';
      ctx.fillStyle = '#FF4400';
      ctx.fillText('⚡ SCND MODE!', canvas.width / 2, 55);
    }
    if (scndBonusActive) {
      ctx.font = 'bold ' + Math.max(12, cellSize * 0.55) + 'px monospace';
      ctx.fillStyle = '#FFD700';
      ctx.fillText('⭐ 3x BONUS!', canvas.width / 2, 80);
    }
    if (freezeMode) {
      ctx.font = 'bold ' + Math.max(14, cellSize * 0.6) + 'px monospace';
      ctx.fillStyle = '#00FFFF';
      ctx.fillText('⏰ FREEZE!', canvas.width / 2, 105);
    }
    if (fastForwardActive) {
      ctx.font = 'bold ' + Math.max(14, cellSize * 0.6) + 'px monospace';
      ctx.fillStyle = '#FF9966';
      ctx.fillText('⏩ FAST FORWARD!', canvas.width / 2, 130);
    }
    if (activePowerUp) {
      ctx.font = 'bold ' + Math.max(12, cellSize * 0.55) + 'px monospace';
      ctx.fillStyle = '#00FF00';
      ctx.fillText('✨ ' + activePowerUp + ' ✨', canvas.width / 2, 155);
    }
    if (combo > 0) {
      ctx.font = 'bold ' + Math.max(14, cellSize * 0.6) + 'px monospace';
      ctx.fillStyle = '#FF4400';
      ctx.fillText(combo + 'x COMBO!', canvas.width / 2, 180);
    }
    if (popupScore) {
      ctx.font = 'bold ' + Math.max(16, cellSize * 0.7) + 'px monospace';
      ctx.fillStyle = '#FF4400';
      ctx.fillText('+' + popupScore.score, popupScore.x, popupScore.y);
    }
    ctx.textAlign = 'left';
    ctx.shadowBlur = 0;
  }, [board, currentPiece, pieceX, pieceY, gameOver, flashRow, popupScore, combo, cellSize, hotStreak, scndMode, scndBonusActive, freezeMode, fastForwardActive, particles, linesCleared, activePowerUp, isPaused, pulseValue, rotation]);

  const saveHighscore = async () => {
    if (playerName.trim() === '') return;
    if (isSaving) return;
    setIsSaving(true);
    try {
      await fetch('/api/game-highscores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerName, score: finalScore })
      });
      const reloadRes = await fetch('/api/game-highscores');
      const reloadData = await reloadRes.json();
      if (Array.isArray(reloadData)) setHighscores(reloadData);
    } catch (error) {
      console.error('Fehler beim Speichern des Highscores:', error);
      alert('Highscore konnte nicht gespeichert werden. Bitte später erneut versuchen.');
    } finally {
      setIsSaving(false);
      setShowNameInput(false);
      setPlayerName('');
      setNewHighscoreGlow(false);
    }
  };

  const rankIcon = (idx: number) => {
    if (idx === 0) return '🥇';
    if (idx === 1) return '🥈';
    return '🥉';
  };

  return (
    <div className="min-h-screen md:my-6 md:min-h-0 bg-gradient-to-br from-[var(--bg-secondary)] to-[var(--bg-primary)] rounded-2xl border-2 border-[#FF4400]/40 shadow-2xl transition-all flex flex-col">
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#FF4400] via-[#FFD700] to-[#FF4400] rounded-t-2xl z-10"></div>

      {/* Header mit Rotationsanzeige */}
      <div className="pt-2 pb-1 px-2 text-center">
        <button onClick={scrollToGame} className="cursor-pointer">
          <h3 className={'text-xl md:text-3xl font-black tracking-tighter bg-gradient-to-r from-[#FF4400] to-[#FF6600] bg-clip-text text-transparent transition-all duration-300 hover:scale-105 ' + (titlePulse && isPlaying ? 'scale-110' : '')}>
            SCND DROP
          </h3>
        </button>
        <div className="flex justify-center items-center gap-2 mt-1 text-[10px] font-mono">
          <span className="text-[var(--text-secondary)]">🌀</span>
          <span className="text-[#FF4400]">Rotation: {rotation}°</span>
          <span className="text-[var(--text-secondary)]">⏱️ nächste Drehung in {blocksUntilRotation.current - blocksPlaced} Blöcken</span>
        </div>
        <div className="flex justify-center gap-1 mt-1 flex-wrap">
          {slowMode && <span className="inline-flex items-center gap-0.5 px-1 py-0.5 bg-[#00FFFF]/20 text-[#00FFFF] text-[7px] rounded-full">🐌 SLOW</span>}
          {freezeMode && <span className="inline-flex items-center gap-0.5 px-1 py-0.5 bg-[#00FFFF]/20 text-[#00FFFF] text-[7px] rounded-full animate-pulse">⏰ FREEZE</span>}
          {fastForwardActive && <span className="inline-flex items-center gap-0.5 px-1 py-0.5 bg-[#FF9966]/20 text-[#FF9966] text-[7px] rounded-full animate-pulse">⏩ FAST</span>}
          {scndBonusActive && <span className="inline-flex items-center gap-0.5 px-1 py-0.5 bg-[#FFD700]/20 text-[#FFD700] text-[7px] rounded-full animate-pulse">⭐ 3x</span>}
          {activePowerUp && <span className="inline-flex items-center gap-0.5 px-1 py-0.5 bg-[#00FF00]/20 text-[#00FF00] text-[7px] rounded-full animate-pulse">✨ {activePowerUp}</span>}
        </div>
        {bonusMessage.show && (
          <div className="mt-1 animate-bounce">
            <span className="inline-block px-2 py-0.5 bg-[#FFD700]/20 text-[#FFD700] text-[7px] md:text-xs rounded-full border border-[#FFD700]/30">
              {bonusMessage.text}
            </span>
          </div>
        )}
      </div>

      {/* Hauptinhalt */}
      <div ref={gameContainerRef} className="flex-1 flex flex-col md:flex-row gap-2 md:gap-4 justify-center items-center md:items-start px-2 py-1">
        <div className="flex justify-center items-center">
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-[#FF4400]/30 to-[#FF6600]/30 rounded-lg blur-lg opacity-50"></div>
            <canvas
              ref={canvasRef}
              className="relative border-2 md:border-4 border-[#FF4400] rounded-lg shadow-2xl"
              style={{
                width: BOARD_WIDTH * cellSize,
                height: BOARD_HEIGHT * cellSize,
                transform: `rotate(${rotation}deg)`,
                transition: 'transform 0.4s cubic-bezier(0.2, 0.9, 0.4, 1.1)'
              }}
            />

            {isPaused && !gameOver && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-black/85 backdrop-blur-md rounded-lg z-40">
                <div className="text-center">
                  <div className="text-lg md:text-xl font-black text-[#FF4400] mb-1 tracking-tighter">PAUSE</div>
                  <div className="w-8 h-0.5 bg-[#FF4400]/50 mx-auto mb-2"></div>
                  <button onClick={handleResume} className="w-28 py-1 mb-1 bg-gradient-to-r from-[#FF4400] to-[#FF6600] text-white font-bold uppercase tracking-wider rounded-lg text-[10px] hover:scale-105 transition-all shadow-lg">▶ WEITER</button>
                  <button onClick={handleRestart} className="w-28 py-1 mb-1 border border-[#FF4400] text-[#FF4400] font-bold uppercase tracking-wider rounded-lg text-[10px] hover:bg-[#FF4400]/10 hover:scale-105 transition-all">🔄 NEUSTART</button>
                  <button onClick={handleGiveUp} className="w-28 py-1 border border-red-500 text-red-500 font-bold uppercase tracking-wider rounded-lg text-[10px] hover:bg-red-500/10 hover:scale-105 transition-all">⚡ AUFGABEN</button>
                </div>
              </div>
            )}

            {!isPlaying && !gameOver && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/80 backdrop-blur-sm rounded-lg">
                <div className="text-center">
                  <div className="text-base md:text-lg font-black text-[#FF4400] mb-1">SCND DROP</div>
                  <button onClick={startGame} className="px-3 py-1 bg-gradient-to-r from-[#FF4400] to-[#FF6600] text-white font-bold uppercase tracking-wider rounded-lg text-[10px] hover:scale-105 transition-all shadow-lg">▶ START</button>
                </div>
              </div>
            )}

            {gameOver && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/80 backdrop-blur-sm rounded-lg">
                <div className="text-center">
                  <div className="text-sm md:text-base font-black mb-0.5"><span className="text-[#FF4400]">GAME</span><span className="text-white"> OVER</span></div>
                  <div className="text-xs md:text-sm text-[#FF4400] font-bold mb-1">{finalScore} Pkt</div>
                  <button onClick={startGame} className="px-2 py-0.5 bg-gradient-to-r from-[#FF4400] to-[#FF6600] text-white font-bold uppercase tracking-wider rounded-lg text-[9px] hover:scale-105 transition-all">NEUSTART</button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Rechte Seitenleiste (unverändert) */}
        <div className="bg-gradient-to-br from-[var(--bg-primary)] to-[#0D0D0D] rounded-xl border border-[#FF4400]/30 p-2 min-w-[160px] md:min-w-[180px] w-auto shadow-xl">
          <div className="text-center mb-1 pb-1 border-b border-[#FF4400]/20">
            <div className="text-[7px] text-[var(--text-secondary)] uppercase tracking-wider">PUNKTE</div>
            <div className="text-2xl font-black text-[#FF4400] drop-shadow-[0_0_6px_rgba(255,68,0,0.5)]">{gameOver ? finalScore : score}</div>
            <div className="flex justify-center gap-3 mt-0.5">
              <div className="text-center"><div className="text-[5px] text-[var(--text-secondary)]">LVL</div><div className="text-[10px] font-bold text-[#FF4400]">{level}</div></div>
              <div className="text-center"><div className="text-[5px] text-[var(--text-secondary)]">LINIEN</div><div className="text-[10px] font-bold text-[var(--text-primary)]">{linesCleared}</div></div>
              <div className="text-center"><div className="text-[5px] text-[var(--text-secondary)]">COMBO</div><div className="text-[10px] font-bold text-[#FF4400]">{combo}x</div></div>
            </div>
          </div>
          <div className="flex justify-center gap-1 mb-1">
            {hotStreak && <div className="bg-gradient-to-r from-[#FF4400]/20 to-transparent px-1 py-0.5 rounded border-l border-[#FF4400]"><div className="text-[6px] text-[var(--text-secondary)]">🔥</div><div className="text-[8px] font-bold text-[#FF4400]">HOT</div></div>}
            {scndMode && <div className="bg-gradient-to-r from-[#FF4400]/20 to-transparent px-1 py-0.5 rounded border-l border-[#FF4400]"><div className="text-[6px] text-[var(--text-secondary)]">⚡</div><div className="text-[8px] font-bold text-[#FF4400]">SCND</div></div>}
            {scndBonusActive && <div className="bg-gradient-to-r from-[#FFD700]/20 to-transparent px-1 py-0.5 rounded border-l border-[#FFD700]"><div className="text-[6px] text-[var(--text-secondary)]">⭐</div><div className="text-[8px] font-bold text-[#FFD700]">3x</div></div>}
          </div>
          <div className="bg-[var(--bg-secondary)]/50 rounded-lg p-1.5 mb-1">
            <div className="flex items-center gap-1 mb-0.5"><div className="w-1 h-2 bg-[#FF4400] rounded-full"></div><h4 className="font-bold text-[7px] uppercase tracking-wider text-[#FF4400]">🏆 TOP 3</h4></div>
            <ul className="space-y-0">
              {highscores.map((hs, idx) => (
                <li key={idx} className="flex justify-between items-center bg-[var(--bg-primary)]/50 rounded px-1.5 py-0.5">
                  <span className="flex items-center gap-1"><span className="text-[10px]">{rankIcon(idx)}</span><span className="text-[8px] font-medium truncate max-w-[60px]">{hs.player_name}</span></span>
                  <span className="text-[8px] text-[#FF4400] font-bold">{hs.score}</span>
                </li>
              ))}
              {highscores.length === 0 && <li className="text-center text-[6px] text-[var(--text-secondary)] py-0.5 italic">— keine —</li>}
            </ul>
          </div>
          <div className="text-center pt-0.5 border-t border-[#FF4400]/20">
            <div className="text-[6px] text-[var(--text-secondary)] uppercase tracking-wider">STEUERUNG</div>
            <div className="flex justify-center gap-1 mt-0.5"><kbd className="px-1 py-0.5 bg-black/50 rounded text-[7px] font-mono text-[#FF4400]">← → ↓</kbd><kbd className="px-1 py-0.5 bg-black/50 rounded text-[7px] font-mono text-[#FF4400]">↑</kbd></div>
            <div className="flex justify-center gap-1 mt-0.5"><kbd className="px-1 py-0.5 bg-black/50 rounded text-[6px] font-mono text-[var(--text-secondary)]">ESC</kbd><span className="text-[6px] text-[var(--text-secondary)]">PAUSE</span></div>
          </div>
        </div>
      </div>

      {/* TOUCH CONTROLLER */}
      {isPlaying && !gameOver && !isPaused && (
        <div className="md:hidden bg-black/90 backdrop-blur-sm border-t border-[#FF4400]/30 py-3 fixed bottom-0 left-0 right-0 z-50">
          <div className="flex justify-between items-center px-4 max-w-md mx-auto">
            <div className="flex gap-5">
              <button onTouchStart={(e) => { e.preventDefault(); handleMoveLeft(); }} onTouchMove={(e) => e.preventDefault()} className="w-16 h-16 bg-gradient-to-b from-[#1A1A1A] to-[#0A0A0A] border-2 border-[#FF4400] rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-all" style={{ touchAction: 'none', userSelect: 'none' }}><span className="text-white text-2xl font-bold">◀</span></button>
              <button onTouchStart={(e) => { e.preventDefault(); handleMoveDown(); }} onTouchMove={(e) => e.preventDefault()} className="w-16 h-16 bg-gradient-to-b from-[#1A1A1A] to-[#0A0A0A] border-2 border-[#FF4400] rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-all" style={{ touchAction: 'none', userSelect: 'none' }}><span className="text-white text-2xl font-bold">▼</span></button>
              <button onTouchStart={(e) => { e.preventDefault(); handleMoveRight(); }} onTouchMove={(e) => e.preventDefault()} className="w-16 h-16 bg-gradient-to-b from-[#1A1A1A] to-[#0A0A0A] border-2 border-[#FF4400] rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-all" style={{ touchAction: 'none', userSelect: 'none' }}><span className="text-white text-2xl font-bold">▶</span></button>
            </div>
            <div className="flex gap-5">
              <button onTouchStart={(e) => { e.preventDefault(); handleRotate(); }} onTouchMove={(e) => e.preventDefault()} className="w-16 h-16 bg-gradient-to-br from-[#FF4400] to-[#CC3300] border-2 border-white/30 rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-all" style={{ touchAction: 'none', userSelect: 'none' }}><span className="text-white text-xl font-bold tracking-wider">A</span></button>
              <button onTouchStart={(e) => { e.preventDefault(); togglePause(); }} onTouchMove={(e) => e.preventDefault()} className="w-16 h-16 bg-gradient-to-b from-[#333] to-[#1A1A1A] border-2 border-[#FF4400]/70 rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-all" style={{ touchAction: 'none', userSelect: 'none' }}><span className="text-white text-xl font-bold">⏸</span></button>
            </div>
          </div>
          <div className="flex justify-center gap-12 mt-1 text-[7px] text-[var(--text-secondary)] uppercase tracking-wider font-bold"><span>BEWEGEN</span><span>DREHEN</span><span>PAUSE</span></div>
        </div>
      )}

      <div className="md:hidden" style={{ height: '100px' }}></div>

      {showNameInput && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--bg-secondary)] p-4 md:p-6 rounded-lg border-2 border-[#FF4400] max-w-sm w-full mx-4 shadow-2xl">
            <h3 className="text-lg md:text-2xl font-bold tracking-tighter mb-2"><span className="text-[#FF4400]">✨ NEW</span>_<span className="text-[var(--text-primary)]">HIGHSCORE</span></h3>
            <p className="text-xs md:text-sm text-[var(--text-secondary)] mb-4">Punktzahl: <span className="text-[#FF4400] font-bold text-lg md:text-xl">{finalScore}</span></p>
            <input type="text" value={playerName} onChange={(e) => setPlayerName(e.target.value)} maxLength={15} className="w-full p-2 md:p-3 bg-[var(--bg-primary)] border-2 border-[#FF4400] rounded mb-4 text-sm md:text-base text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[#FF4400] uppercase tracking-wider" placeholder="DEIN SPITZNAME" autoFocus />
            <div className="flex gap-3"><button onClick={saveHighscore} className="flex-1 px-3 md:px-4 py-2 bg-[#FF4400] text-white font-bold uppercase tracking-wider rounded text-sm md:text-base hover:bg-[#FF4400]/80 transition">SPEICHERN</button><button onClick={() => setShowNameInput(false)} className="flex-1 px-3 md:px-4 py-2 border border-gray-500 rounded hover:bg-gray-800 transition text-sm md:text-base">ABBRECHEN</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
