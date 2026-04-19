// src/components/ScndDropGame.tsx
'use client';

import { useEffect, useRef, useState } from 'react';

const BOARD_WIDTH = 20;
const BOARD_HEIGHT = 20;
type Rotation = 0 | 90 | 180 | 270;

const getCellSize = () => {
  if (typeof window === 'undefined') return 24;
  const height = window.innerHeight;
  const availableHeight = height - 220;
  let cell = Math.floor(availableHeight / BOARD_HEIGHT);
  return Math.min(Math.max(cell, 16), 28);
};

const TETROMINOS = [
  { shape: [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]], color: '#FF8844', borderColor: '#CC5500', name: 'I', isPowerUp: false },
  { shape: [[0,0,0,0],[0,1,1,0],[0,1,1,0],[0,0,0,0]], color: '#FFDD44', borderColor: '#CCAA00', name: 'O', isPowerUp: false },
  { shape: [[0,0,0,0],[0,1,0,0],[1,1,1,0],[0,0,0,0]], color: '#FF6666', borderColor: '#CC3333', name: 'T', isPowerUp: false },
  { shape: [[0,0,0,0],[0,1,1,0],[1,1,0,0],[0,0,0,0]], color: '#AAAAAA', borderColor: '#666666', name: 'S', isPowerUp: false },
  { shape: [[0,0,0,0],[1,1,0,0],[0,1,1,0],[0,0,0,0]], color: '#EEEEEE', borderColor: '#CCCCCC', name: 'Z', isPowerUp: false },
  { shape: [[0,0,0,0],[1,0,0,0],[1,1,1,0],[0,0,0,0]], color: '#5588FF', borderColor: '#2255AA', name: 'L', isPowerUp: false },
  { shape: [[0,0,0,0],[0,0,1,0],[1,1,1,0],[0,0,0,0]], color: '#55DD88', borderColor: '#229955', name: 'J', isPowerUp: false }
];

const POWERUP_TETROMINOS = [
  { shape: [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]], color: '#FF9999', borderColor: '#FF4444', name: '💣 BOMBE', isPowerUp: true, powerUpEffect: 'bomb', glowColor: '#FF6666' },
  { shape: [[0,0,0,0],[0,1,1,0],[0,1,1,0],[0,0,0,0]], color: '#FFAAFF', borderColor: '#FF55FF', name: '⚡ LASER', isPowerUp: true, powerUpEffect: 'laser', glowColor: '#FF66FF' },
  { shape: [[0,0,0,0],[0,1,0,0],[1,1,1,0],[0,0,0,0]], color: '#FFEECC', borderColor: '#FFCC66', name: '🎨 FARBE', isPowerUp: true, powerUpEffect: 'colorBlast', glowColor: '#FFDD88' },
  { shape: [[0,0,0,0],[0,1,1,0],[1,1,0,0],[0,0,0,0]], color: '#FFDD88', borderColor: '#FFAA44', name: '⭐ 3x', isPowerUp: true, powerUpEffect: 'scndBonus', glowColor: '#FFCC66' },
  { shape: [[0,0,0,0],[1,1,0,0],[0,1,1,0],[0,0,0,0]], color: '#AAFFFF', borderColor: '#44FFFF', name: '⏰ FREEZE', isPowerUp: true, powerUpEffect: 'freeze', glowColor: '#66FFFF' },
  { shape: [[0,0,0,0],[1,0,0,0],[1,1,1,0],[0,0,0,0]], color: '#CCFFCC', borderColor: '#66FF66', name: '🌀 GRAVITY', isPowerUp: true, powerUpEffect: 'gravity', glowColor: '#88FF88' },
  { shape: [[0,0,0,0],[0,0,1,0],[1,1,1,0],[0,0,0,0]], color: '#FFCCDD', borderColor: '#FF88AA', name: '🔄 SWAP', isPowerUp: true, powerUpEffect: 'swap', glowColor: '#FF99BB' },
  { shape: [[0,0,0,0],[1,1,0,0],[0,1,1,0],[0,0,0,0]], color: '#DDDDFF', borderColor: '#9999FF', name: '🔍 CLEAR LINE', isPowerUp: true, powerUpEffect: 'clearLine', glowColor: '#AAAADD' },
  { shape: [[0,0,0,0],[0,1,1,0],[0,1,1,0],[0,0,0,0]], color: '#FFDDCC', borderColor: '#FFAA88', name: '⏩ FAST FORWARD', isPowerUp: true, powerUpEffect: 'fastForward', glowColor: '#FFBB99' },
  { shape: [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]], color: '#FFCCFF', borderColor: '#FF88FF', name: '🎲 RANDOM', isPowerUp: true, powerUpEffect: 'randomize', glowColor: '#FFAAFF' }
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
  const [flashCol, setFlashCol] = useState<number | null>(null);
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
  const gravityIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [titlePulse, setTitlePulse] = useState(false);
  const [bonusMessage, setBonusMessage] = useState<{ show: boolean; text: string }>({ show: false, text: '' });
  const [isSaving, setIsSaving] = useState(false);
  const [pulseValue, setPulseValue] = useState(0);
  
  // Ghost Mode für Spawn
  const [isGhostMode, setIsGhostMode] = useState(false);
  const ghostTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Rotation (visuell)
  const [rotation, setRotation] = useState<Rotation>(0);
  const [blocksPlaced, setBlocksPlaced] = useState(0);
  const blocksUntilRotation = useRef<number>(Math.floor(Math.random() * 5) + 1);
  const [rotationPending, setRotationPending] = useState(false);

  const changeRotationRandom = () => {
    const rots: Rotation[] = [0, 90, 180, 270];
    let newRot = rots[Math.floor(Math.random() * rots.length)];
    while (newRot === rotation) newRot = rots[Math.floor(Math.random() * rots.length)];
    setRotation(newRot);
    if (canvasRef.current) {
      canvasRef.current.style.transform = `rotate(${newRot}deg)`;
      canvasRef.current.style.transition = 'transform 0.4s cubic-bezier(0.2, 0.9, 0.4, 1.1)';
    }
    if (window.navigator.vibrate) window.navigator.vibrate(100);
  };

  const checkAndRotate = () => {
    setBlocksPlaced(prev => {
      const newCount = prev + 1;
      if (newCount >= blocksUntilRotation.current) {
        blocksUntilRotation.current = Math.floor(Math.random() * 5) + 1;
        setRotationPending(true);
        changeRotationRandom();
        setTimeout(() => setRotationPending(false), 500);
        return 0;
      }
      return newCount;
    });
  };

  const translateMove = (screenDx: number, screenDy: number): { dx: number; dy: number } => {
    switch (rotation) {
      case 0:   return { dx: screenDx, dy: screenDy };
      case 90:  return { dx: screenDy, dy: -screenDx };
      case 180: return { dx: -screenDx, dy: -screenDy };
      case 270: return { dx: -screenDy, dy: screenDx };
      default: return { dx: screenDx, dy: screenDy };
    }
  };

  const screenToBoard = (screenX: number, screenY: number): { x: number; y: number } => {
    const cs = getCellSize();
    const centerX = (BOARD_WIDTH * cs) / 2;
    const centerY = (BOARD_HEIGHT * cs) / 2;
    let dx = screenX - centerX;
    let dy = screenY - centerY;
    switch (rotation) {
      case 90: { const tmp = dx; dx = -dy; dy = tmp; break; }
      case 180: dx = -dx; dy = -dy; break;
      case 270: { const tmp = dx; dx = dy; dy = -tmp; break; }
      default: break;
    }
    let boardX = (dx + centerX) / cs;
    let boardY = (dy + centerY) / cs;
    boardX = Math.min(Math.max(0, boardX), BOARD_WIDTH - 1);
    boardY = Math.min(Math.max(0, boardY), BOARD_HEIGHT - 1);
    return { x: Math.floor(boardX), y: Math.floor(boardY) };
  };

  // Spawn immer exakt an der oberen Bildschirmmitte (rotationsunabhängig)
  const getSpawnPosition = (pieceShape: number[][]): { x: number; y: number } => {
    const cs = getCellSize();
    const screenX = (BOARD_WIDTH * cs) / 2;
    const screenY = 0;
    const { x, y } = screenToBoard(screenX, screenY);
    const pieceWidth = pieceShape[0].length;
    const pieceHeight = pieceShape.length;
    let startX = Math.floor(x - pieceWidth / 2);
    let startY = y;
    startX = Math.min(Math.max(0, startX), BOARD_WIDTH - pieceWidth);
    startY = Math.min(Math.max(0, startY), BOARD_HEIGHT - pieceHeight);
    return { x: startX, y: startY };
  };

  const collision = (shape: number[][], offsetX: number, offsetY: number, ignoreBoard = false) => {
    for (let y = 0; y < shape.length; y++) {
      for (let x = 0; x < shape[y].length; x++) {
        if (shape[y][x] !== 0) {
          const boardX = offsetX + x, boardY = offsetY + y;
          if (boardX < 0 || boardX >= BOARD_WIDTH || boardY >= BOARD_HEIGHT || boardY < 0) return true;
          if (!ignoreBoard && boardY >= 0 && board[boardY]?.[boardX] !== null) return true;
        }
      }
    }
    return false;
  };

  // Ghost-Modus beenden
  const disableGhostMode = () => {
    if (ghostTimerRef.current) clearTimeout(ghostTimerRef.current);
    setIsGhostMode(false);
  };

  // Gravity etc. (unverändert)
  const applyGravityWithRotation = (currentBoard: any[][]) => {
    const anchored = Array(BOARD_HEIGHT).fill(null).map(() => Array(BOARD_WIDTH).fill(false));
    const queue: [number, number][] = [];

    for (let x = 0; x < BOARD_WIDTH; x++) {
      if (currentBoard[0][x] !== null) { anchored[0][x] = true; queue.push([0, x]); }
      if (currentBoard[BOARD_HEIGHT-1][x] !== null) { anchored[BOARD_HEIGHT-1][x] = true; queue.push([BOARD_HEIGHT-1, x]); }
    }
    for (let y = 0; y < BOARD_HEIGHT; y++) {
      if (currentBoard[y][0] !== null) { anchored[y][0] = true; queue.push([y, 0]); }
      if (currentBoard[y][BOARD_WIDTH-1] !== null) { anchored[y][BOARD_WIDTH-1] = true; queue.push([y, BOARD_WIDTH-1]); }
    }

    const dirs = [[-1,0],[1,0],[0,-1],[0,1]];
    while (queue.length) {
      const [y, x] = queue.shift()!;
      for (const [dy, dx] of dirs) {
        const ny = y + dy, nx = x + dx;
        if (ny >= 0 && ny < BOARD_HEIGHT && nx >= 0 && nx < BOARD_WIDTH && !anchored[ny][nx] && currentBoard[ny][nx] !== null) {
          anchored[ny][nx] = true;
          queue.push([ny, nx]);
        }
      }
    }

    const fallDir = translateMove(0, 1);
    if (fallDir.dx === 0 && fallDir.dy === 0) return currentBoard;

    let changed = true;
    while (changed) {
      changed = false;
      const blocks: { y: number, x: number, block: any }[] = [];
      for (let y = 0; y < BOARD_HEIGHT; y++) {
        for (let x = 0; x < BOARD_WIDTH; x++) {
          if (currentBoard[y][x] !== null && !anchored[y][x]) {
            blocks.push({ y, x, block: currentBoard[y][x] });
          }
        }
      }
      if (fallDir.dy > 0) blocks.sort((a,b) => b.y - a.y);
      else if (fallDir.dy < 0) blocks.sort((a,b) => a.y - b.y);
      if (fallDir.dx > 0) blocks.sort((a,b) => b.x - a.x);
      else if (fallDir.dx < 0) blocks.sort((a,b) => a.x - b.x);

      for (const { y, x, block } of blocks) {
        const newX = x + fallDir.dx;
        const newY = y + fallDir.dy;
        if (newX >= 0 && newX < BOARD_WIDTH && newY >= 0 && newY < BOARD_HEIGHT && currentBoard[newY][newX] === null) {
          currentBoard[y][x] = null;
          currentBoard[newY][newX] = block;
          changed = true;
        }
      }
    }
    return currentBoard;
  };

  const clearLineGroups = (newBoard: any[][]): { rowsCleared: number } => {
    let totalCleared = 0;
    const deleteChain = (cells: [number, number][]) => {
      for (const [y, x] of cells) {
        newBoard[y][x] = null;
        burstParticles(x * cellSize + cellSize/2, y * cellSize + cellSize/2, 5);
      }
      totalCleared++;
    };

    // Horizontal
    for (let row = 0; row < BOARD_HEIGHT; row++) {
      let runStart = -1, runLen = 0;
      for (let x = 0; x <= BOARD_WIDTH; x++) {
        const cell = (x < BOARD_WIDTH) ? newBoard[row][x] : null;
        if (cell !== null) {
          if (runStart === -1) runStart = x;
          runLen++;
        } else {
          if (runLen >= 10) {
            const cells: [number, number][] = [];
            for (let i = runStart; i < runStart + runLen; i++) cells.push([row, i]);
            deleteChain(cells);
          }
          runStart = -1; runLen = 0;
        }
      }
    }
    // Vertikal
    for (let col = 0; col < BOARD_WIDTH; col++) {
      let runStart = -1, runLen = 0;
      for (let y = 0; y <= BOARD_HEIGHT; y++) {
        const cell = (y < BOARD_HEIGHT) ? newBoard[y][col] : null;
        if (cell !== null) {
          if (runStart === -1) runStart = y;
          runLen++;
        } else {
          if (runLen >= 10) {
            const cells: [number, number][] = [];
            for (let i = runStart; i < runStart + runLen; i++) cells.push([i, col]);
            deleteChain(cells);
          }
          runStart = -1; runLen = 0;
        }
      }
    }
    // Diagonal (links oben -> rechts unten)
    for (let startRow = 0; startRow < BOARD_HEIGHT; startRow++) {
      for (let startCol = 0; startCol < BOARD_WIDTH; startCol++) {
        let runLen = 0, y = startRow, x = startCol;
        while (y < BOARD_HEIGHT && x < BOARD_WIDTH && newBoard[y][x] !== null) { runLen++; y++; x++; }
        if (runLen >= 10) {
          const cells: [number, number][] = [];
          for (let i = 0; i < runLen; i++) cells.push([startRow + i, startCol + i]);
          deleteChain(cells);
        }
      }
    }
    // Diagonal (rechts oben -> links unten)
    for (let startRow = 0; startRow < BOARD_HEIGHT; startRow++) {
      for (let startCol = BOARD_WIDTH - 1; startCol >= 0; startCol--) {
        let runLen = 0, y = startRow, x = startCol;
        while (y < BOARD_HEIGHT && x >= 0 && newBoard[y][x] !== null) { runLen++; y++; x--; }
        if (runLen >= 10) {
          const cells: [number, number][] = [];
          for (let i = 0; i < runLen; i++) cells.push([startRow + i, startCol - i]);
          deleteChain(cells);
        }
      }
    }

    applyGravityWithRotation(newBoard);
    return { rowsCleared: totalCleared };
  };

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
    setTimeout(() => setActivePowerUp(null), 2000);
  };

  // ========== SPIEL-LOGIK ==========
  const spawnNewPiece = () => {
    if (rotationPending) {
      setTimeout(() => spawnNewPiece(), 100);
      return;
    }
    const isPowerUpSpawn = Math.random() < 0.15;
    const pool = isPowerUpSpawn ? POWERUP_TETROMINOS : TETROMINOS;
    const random = Math.floor(Math.random() * pool.length);
    const piece = JSON.parse(JSON.stringify(pool[random]));
    setCurrentPiece(piece);
    const { x, y } = getSpawnPosition(piece.shape);
    setPieceX(x);
    setPieceY(y);
    
    // Ghost-Modus aktivieren
    setIsGhostMode(true);
    if (ghostTimerRef.current) clearTimeout(ghostTimerRef.current);
    ghostTimerRef.current = setTimeout(() => {
      setIsGhostMode(false);
    }, 2000); // 2 Sekunden Gnadenfrist
  };

  const endGame = () => {
    setGameOver(true);
    setFinalScore(score);
    setIsPlaying(false);
    setIsPaused(false);
    if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    if (gravityIntervalRef.current) clearInterval(gravityIntervalRef.current);
    if (ghostTimerRef.current) clearTimeout(ghostTimerRef.current);
    if (!showNameInput && !isSaving) {
      const isHighscore = highscores.length < 3 || score > (highscores[2]?.score || 0);
      if (score > 0 && isHighscore) {
        setShowNameInput(true);
        setNewHighscoreGlow(true);
        setTimeout(() => setNewHighscoreGlow(false), 2000);
      }
    }
  };

  const mergePiece = () => {
    if (!currentPiece) return;
    let newBoard = board.map(row => [...row]);

    for (let y = 0; y < currentPiece.shape.length; y++) {
      for (let x = 0; x < currentPiece.shape[y].length; x++) {
        if (currentPiece.shape[y][x] !== 0) {
          const boardX = pieceX + x, boardY = pieceY + y;
          if (boardY >= 0 && boardY < BOARD_HEIGHT && boardX >= 0 && boardX < BOARD_WIDTH) {
            newBoard[boardY][boardX] = {
              color: currentPiece.color,
              borderColor: currentPiece.borderColor,
              isPowerUp: currentPiece.isPowerUp || false,
              powerUpEffect: currentPiece.powerUpEffect,
              glowColor: currentPiece.glowColor
            };
          }
        }
      }
    }

    const { rowsCleared } = clearLineGroups(newBoard);

    const points = [0, 40, 100, 300, 1200];
    let addedScore = points[Math.min(rowsCleared, 4)];
    if (rowsCleared > 0) {
      const newCombo = combo + 1;
      setCombo(newCombo);
      let multiplier = 1 + newCombo * 0.15;
      if (scndBonusActive) multiplier *= 3;
      addedScore = Math.floor(addedScore * multiplier);
      addedScore *= 2;
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

    // Nach erfolgreichem Merge Ghost-Modus deaktivieren
    disableGhostMode();

    // Prüfen ob weiterer Spawn möglich (einfach nur neues Teil erzeugen – keine Kollisionsprüfung nötig)
    spawnNewPiece();
  };

  const movePiece = (screenDx: number, screenDy: number) => {
    if (!currentPiece || gameOver || freezeMode || isPaused || rotationPending) return;
    const { dx, dy } = translateMove(screenDx, screenDy);
    const newX = pieceX + dx;
    const newY = pieceY + dy;
    
    // Im Ghost-Modus ignorieren wir Kollision mit anderen Blöcken (nur Wandkollision)
    const ignoreBoard = isGhostMode;
    if (!collision(currentPiece.shape, newX, newY, ignoreBoard)) {
      setPieceX(newX);
      setPieceY(newY);
    } else if (screenDy === 1) {
      // Fall: Block würde mit Wand oder (wenn nicht Ghost) mit anderem Block kollidieren
      // Wenn Ghost-Modus aktiv und nur Wandkollision, dann trotzdem mergen? 
      // Eigentlich soll Ghost nur Blöcke ignorieren, Wände aber nicht.
      // Bei Wandkollision oder nach Ghost-Ablauf wird gemerged.
      mergePiece();
    }
  };

  const rotatePiece = () => {
    if (!currentPiece || gameOver || freezeMode || isPaused || rotationPending) return;
    const rotated = currentPiece.shape[0].map((_: any, idx: number) => 
      currentPiece.shape.map((row: any[]) => row[idx]).reverse()
    );
    // Drehung erlaubt auch im Ghost-Modus (Kollision mit Blöcken ignorieren)
    const ignoreBoard = isGhostMode;
    if (!collision(rotated, pieceX, pieceY, ignoreBoard)) {
      setCurrentPiece({ ...currentPiece, shape: rotated });
    }
  };

  const handleMoveLeft = () => movePiece(-1, 0);
  const handleMoveRight = () => movePiece(1, 0);
  const handleMoveDown = () => movePiece(0, 1);
  const handleRotate = () => rotatePiece();

  // Tastatur
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
  }, [currentPiece, pieceX, pieceY, board, gameOver, freezeMode, isPaused, rotationPending, isGhostMode]);

  const getFallDelay = () => {
    if (freezeMode) return Infinity;
    let delay = Math.max(150, 800 - (level - 1) * 50);
    if (slowMode) delay *= 2;
    if (fastForwardActive) delay /= 2;
    return delay;
  };

  // Game Loop (fallender Block)
  useEffect(() => {
    if (!isPlaying || gameOver || freezeMode || isPaused || !currentPiece || rotationPending) {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
      return;
    }
    let lastFall = performance.now();
    const delay = getFallDelay();
    if (delay === Infinity) return;
    const step = (now: number) => {
      if (!isPlaying || gameOver || freezeMode || isPaused || !currentPiece || rotationPending) return;
      if (now - lastFall >= delay) {
        movePieceRef.current(0, 1);
        lastFall = now;
      }
      gameLoopRef.current = requestAnimationFrame(step);
    };
    gameLoopRef.current = requestAnimationFrame(step);
    return () => { if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current); };
  }, [isPlaying, gameOver, freezeMode, isPaused, level, slowMode, fastForwardActive, currentPiece, rotationPending]);

  useEffect(() => { movePieceRef.current = movePiece; }, [movePiece]);

  // Dauerhafte Schwerkraft
  useEffect(() => {
    if (isPlaying && !gameOver && !isPaused) {
      if (gravityIntervalRef.current) clearInterval(gravityIntervalRef.current);
      gravityIntervalRef.current = setInterval(() => {
        setBoard(prevBoard => applyGravityWithRotation(prevBoard.map(row => [...row])));
      }, 200);
    } else {
      if (gravityIntervalRef.current) clearInterval(gravityIntervalRef.current);
    }
    return () => { if (gravityIntervalRef.current) clearInterval(gravityIntervalRef.current); };
  }, [isPlaying, gameOver, isPaused]);

  // Pulsieren
  useEffect(() => {
    let animFrame: number;
    const step = () => {
      setPulseValue(Date.now() * 0.008);
      animFrame = requestAnimationFrame(step);
    };
    if (isPlaying && !gameOver && !isPaused) animFrame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animFrame);
  }, [isPlaying, gameOver, isPaused]);

  // Partikel Lebensdauer
  useEffect(() => {
    if (particles.length === 0) return;
    const interval = setInterval(() => {
      setParticles(prev => prev.filter(p => p.life > 0).map(p => ({ ...p, life: p.life - 0.05 })));
    }, 30);
    return () => clearInterval(interval);
  }, [particles]);

  // Scroll-Verhalten
  const isElementInViewport = (el: HTMLElement) => {
    const rect = el.getBoundingClientRect();
    return rect.top >= 0 && rect.bottom <= window.innerHeight;
  };
  const centerCanvasInView = () => {
    if (gameContainerRef.current && !isElementInViewport(gameContainerRef.current)) {
      gameContainerRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };
  useEffect(() => {
    if (isPlaying && !gameOver && !isPaused) {
      const timer = setTimeout(centerCanvasInView, 200);
      return () => clearTimeout(timer);
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

  useEffect(() => {
    if (isPlaying && !gameOver) {
      const interval = setInterval(() => setTitlePulse(prev => !prev), 500);
      return () => clearInterval(interval);
    }
  }, [isPlaying, gameOver]);

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
    setBlocksPlaced(0);
    blocksUntilRotation.current = Math.floor(Math.random() * 5) + 1;
    const rots: Rotation[] = [0, 90, 180, 270];
    const randomRot = rots[Math.floor(Math.random() * rots.length)];
    setRotation(randomRot);
    if (canvasRef.current) canvasRef.current.style.transform = `rotate(${randomRot}deg)`;
    setRotationPending(false);
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
      if (gravityIntervalRef.current) clearInterval(gravityIntervalRef.current);
      if (ghostTimerRef.current) clearTimeout(ghostTimerRef.current);
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
  const handleRestart = () => { setIsPaused(false); startGame(); };
  const handleGiveUp = () => { setIsPaused(false); giveUp(); };

  const getGhostPosition = () => {
    let testX = pieceX, testY = pieceY;
    while (true) {
      const { dx, dy } = translateMove(0, 1);
      const nextX = testX + dx;
      const nextY = testY + dy;
      if (collision(currentPiece.shape, nextX, nextY, false)) break;
      testX = nextX;
      testY = nextY;
    }
    return { x: testX, y: testY };
  };

  // ========== CANVAS ZEICHNEN ==========
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
          if (cell.isPowerUp) {
            ctx.fillStyle = '#FFFFFF';
            ctx.font = `bold ${Math.max(12, cellSize * 0.4)}px monospace`;
            ctx.fillText('✨', x * cellSize + cellSize * 0.65, y * cellSize + cellSize * 0.8);
          }
          ctx.shadowBlur = 0;
        }
        if (flashRow === y || flashCol === x) {
          ctx.fillStyle = '#FF440080';
          ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
        }
      }
    }
    ctx.globalAlpha = 1;

    if (currentPiece && !gameOver && !freezeMode && !isPaused && !rotationPending) {
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
      const glowIntensity = 10 + 5 * Math.sin(pulseValue);
      ctx.shadowBlur = glowIntensity;
      ctx.shadowColor = isGhostMode ? '#AAAAFF' : 'white';
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
                ctx.font = `bold ${Math.max(12, cellSize * 0.4)}px monospace`;
                ctx.fillText('✨', boardX * cellSize + cellSize * 0.65, boardY * cellSize + cellSize * 0.8);
              }
            }
          }
        }
      }
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;
    }

    for (const p of particles) {
      ctx.fillStyle = `rgba(255, 68, 0, ${p.life})`;
      ctx.fillRect(p.x - 2, p.y - 2, 4, 4);
    }

    const progress = ((linesCleared % 8) / 8) * canvas.width;
    ctx.fillStyle = '#1A1A1A';
    ctx.fillRect(0, canvas.height - 5, canvas.width, 4);
    ctx.fillStyle = '#FF4400';
    ctx.fillRect(0, canvas.height - 5, progress, 4);
  }, [board, currentPiece, pieceX, pieceY, gameOver, flashRow, flashCol, combo, cellSize, hotStreak, scndMode, scndBonusActive, freezeMode, fastForwardActive, particles, linesCleared, activePowerUp, isPaused, pulseValue, rotation, rotationPending, isGhostMode]);

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

      <div className="pt-2 pb-1 px-2 text-center">
        <h3 className={'text-xl md:text-3xl font-black tracking-tighter bg-gradient-to-r from-[#FF4400] to-[#FF6600] bg-clip-text text-transparent transition-all duration-300 ' + (titlePulse && isPlaying ? 'scale-110' : '')}>
          SCND DROP
        </h3>
        <div className="flex justify-center gap-1 mt-1 flex-wrap">
          {slowMode && <span className="inline-flex items-center gap-0.5 px-1 py-0.5 bg-[#00FFFF]/20 text-[#00FFFF] text-[7px] rounded-full">🐌 SLOW</span>}
          {freezeMode && <span className="inline-flex items-center gap-0.5 px-1 py-0.5 bg-[#00FFFF]/20 text-[#00FFFF] text-[7px] rounded-full animate-pulse">⏰ FREEZE</span>}
          {fastForwardActive && <span className="inline-flex items-center gap-0.5 px-1 py-0.5 bg-[#FF9966]/20 text-[#FF9966] text-[7px] rounded-full animate-pulse">⏩ FAST</span>}
          {scndBonusActive && <span className="inline-flex items-center gap-0.5 px-1 py-0.5 bg-[#FFD700]/20 text-[#FFD700] text-[7px] rounded-full animate-pulse">⭐ 3x</span>}
          {activePowerUp && <span className="inline-flex items-center gap-0.5 px-1 py-0.5 bg-[#00FF00]/20 text-[#00FF00] text-[7px] rounded-full animate-pulse">✨ {activePowerUp}</span>}
          {isGhostMode && <span className="inline-flex items-center gap-0.5 px-1 py-0.5 bg-[#AAAAFF]/20 text-[#AAAAFF] text-[7px] rounded-full animate-pulse">👻 GHOST</span>}
        </div>
        {bonusMessage.show && (
          <div className="mt-1 animate-bounce">
            <span className="inline-block px-2 py-0.5 bg-[#FFD700]/20 text-[#FFD700] text-[7px] md:text-xs rounded-full border border-[#FFD700]/30">
              {bonusMessage.text}
            </span>
          </div>
        )}
      </div>

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
