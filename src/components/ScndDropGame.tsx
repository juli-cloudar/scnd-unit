// src/components/ScndDropGame.tsx
'use client';

import { useEffect, useRef, useState } from 'react';

const BOARD_WIDTH = 20;
const BOARD_HEIGHT = 20;
type Rotation = 0 | 90 | 180 | 270;

const getCellSize = () => {
  if (typeof window === 'undefined') return 24;
  const width = window.innerWidth;
  const maxCell = Math.floor((width - 40) / BOARD_WIDTH);
  return Math.min(Math.max(16, maxCell), 32);
};

// ========== TETROMINOS ==========
const TETROMINOS = [
  { shape: [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]], color: '#FF8844', borderColor: '#CC5500', name: 'I', isPowerUp: false },
  { shape: [[0,0,0,0],[0,1,1,0],[0,1,1,0],[0,0,0,0]], color: '#FFDD44', borderColor: '#CCAA00', name: 'O', isPowerUp: false },
  { shape: [[0,0,0,0],[0,1,0,0],[1,1,1,0],[0,0,0,0]], color: '#FF6666', borderColor: '#CC3333', name: 'T', isPowerUp: false },
  { shape: [[0,0,0,0],[0,1,1,0],[1,1,0,0],[0,0,0,0]], color: '#AAAAAA', borderColor: '#666666', name: 'S', isPowerUp: false },
  { shape: [[0,0,0,0],[1,1,0,0],[0,1,1,0],[0,0,0,0]], color: '#EEEEEE', borderColor: '#CCCCCC', name: 'Z', isPowerUp: false },
  { shape: [[0,0,0,0],[1,0,0,0],[1,1,1,0],[0,0,0,0]], color: '#5588FF', borderColor: '#2255AA', name: 'L', isPowerUp: false },
  { shape: [[0,0,0,0],[0,0,1,0],[1,1,1,0],[0,0,0,0]], color: '#55DD88', borderColor: '#229955', name: 'J', isPowerUp: false },
  // Neue Formen
  { shape: [[0,1,0],[1,1,1],[0,1,0]], color: '#FF88FF', borderColor: '#AA44AA', name: '➕ PLUS', isPowerUp: false },
  { shape: [[1,1],[1,0],[1,0]], color: '#88FF88', borderColor: '#44AA44', name: '⤴️ HAKEN', isPowerUp: false },
  { shape: [[1,1,1,1,1]], color: '#FF8888', borderColor: '#AA4444', name: '5️⃣ FÜNFER', isPowerUp: false },
  { shape: [[1,1],[1,1],[1,0]], color: '#88AAFF', borderColor: '#4466AA', name: '▦ EXTRA', isPowerUp: false }
];

// ========== POWER-UP TETROMINOS ==========
const POWERUP_TETROMINOS = [
  { shape: [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]], color: '#FF4444', borderColor: '#AA0000', name: '💣 BOMBE', isPowerUp: true, powerUpEffect: 'bomb', glowColor: '#FF6666' },
  { shape: [[0,0,0,0],[0,1,1,0],[0,1,1,0],[0,0,0,0]], color: '#FF44FF', borderColor: '#AA00AA', name: '⚡ LASER', isPowerUp: true, powerUpEffect: 'laser', glowColor: '#FF88FF' },
  { shape: [[0,0,0,0],[0,1,0,0],[1,1,1,0],[0,0,0,0]], color: '#FFD700', borderColor: '#AA8800', name: '🎨 FARBE', isPowerUp: true, powerUpEffect: 'colorBlast', glowColor: '#FFDD88' },
  { shape: [[0,0,0,0],[0,1,1,0],[1,1,0,0],[0,0,0,0]], color: '#FFAA00', borderColor: '#AA6600', name: '⭐ 3x', isPowerUp: true, powerUpEffect: 'scndBonus', glowColor: '#FFCC66' },
  { shape: [[0,0,0,0],[1,1,0,0],[0,1,1,0],[0,0,0,0]], color: '#00FFFF', borderColor: '#00AAAA', name: '❄️ FREEZE', isPowerUp: true, powerUpEffect: 'freeze', glowColor: '#66FFFF' },
  { shape: [[0,0,0,0],[1,0,0,0],[1,1,1,0],[0,0,0,0]], color: '#88FF88', borderColor: '#44AA44', name: '🌀 GRAVITY', isPowerUp: true, powerUpEffect: 'gravity', glowColor: '#AAFFAA' },
  { shape: [[0,0,0,0],[0,0,1,0],[1,1,1,0],[0,0,0,0]], color: '#FF88AA', borderColor: '#AA4466', name: '🔄 SWAP', isPowerUp: true, powerUpEffect: 'swap', glowColor: '#FFAACC' },
  { shape: [[0,0,0,0],[1,1,0,0],[0,1,1,0],[0,0,0,0]], color: '#8888FF', borderColor: '#4444AA', name: '🔍 CLEAR', isPowerUp: true, powerUpEffect: 'clearLine', glowColor: '#AAAADD' },
  { shape: [[0,0,0,0],[0,1,1,0],[0,1,1,0],[0,0,0,0]], color: '#FF9966', borderColor: '#AA5522', name: '⏩ FAST', isPowerUp: true, powerUpEffect: 'fastForward', glowColor: '#FFBB99' },
  { shape: [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]], color: '#FFCCFF', borderColor: '#AA88AA', name: '🎲 RANDOM', isPowerUp: true, powerUpEffect: 'randomize', glowColor: '#FFAAFF' },
  { shape: [[1,1],[1,1]], color: '#88FFFF', borderColor: '#44AAAA', name: '🧬 CLONE', isPowerUp: true, powerUpEffect: 'clone', glowColor: '#AAFFFF' },
  { shape: [[1,1,1],[1,0,1],[1,1,1]], color: '#88FFAA', borderColor: '#44AA66', name: '🐢 SLOW MO', isPowerUp: true, powerUpEffect: 'slowMo', glowColor: '#AAFFCC' },
  { shape: [[0,1,0],[1,1,1],[0,1,0]], color: '#AA88FF', borderColor: '#6644AA', name: '⬆️ ANTI-GRAVITY', isPowerUp: true, powerUpEffect: 'antiGravity', glowColor: '#CCAADD' },
  { shape: [[1,1,1,1]], color: '#FF88AA', borderColor: '#AA4466', name: '🌈 RAINBOW', isPowerUp: true, powerUpEffect: 'rainbow', glowColor: '#FFAACC' },
  { shape: [[1,1,1],[1,1,1],[1,1,1]], color: '#FF4444', borderColor: '#AA0000', name: '💥 MEGA BOMBE', isPowerUp: true, powerUpEffect: 'megaBomb', glowColor: '#FF8888' },
  { shape: [[0,1,0],[1,1,1],[0,1,0]], color: '#CCCCFF', borderColor: '#8888AA', name: '🛡️ SHIELD', isPowerUp: true, powerUpEffect: 'shield', glowColor: '#FFFFFF' },
  { shape: [[1,1],[1,1]], color: '#FFDD88', borderColor: '#AA8855', name: '💰 DOUBLE SCORE', isPowerUp: true, powerUpEffect: 'doubleScore', glowColor: '#FFEEAA' },
  { shape: [[1,0,1],[0,1,0],[1,0,1]], color: '#88AACC', borderColor: '#557799', name: '🧹 CLEANSE', isPowerUp: true, powerUpEffect: 'cleanse', glowColor: '#AACCEE' },
  { shape: [[1,1,1],[1,0,1],[1,1,1]], color: '#CCAA88', borderColor: '#997755', name: '⏪ REWIND', isPowerUp: true, powerUpEffect: 'rewind', glowColor: '#DDCCAA' },
  { shape: [[0,1,0],[1,1,1],[0,1,0]], color: '#FFAA55', borderColor: '#AA7733', name: '☄️ METEOR', isPowerUp: true, powerUpEffect: 'meteor', glowColor: '#FFCC88' }
];

interface Highscore {
  player_name: string;
  score: number;
}

interface GameState {
  board: any[][];
  score: number;
  linesCleared: number;
  level: number;
  combo: number;
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
  const [antiGravityActive, setAntiGravityActive] = useState(false);
  const [doubleScoreActive, setDoubleScoreActive] = useState(false);
  const [shieldActive, setShieldActive] = useState(false);
  const gameLoopRef = useRef<number | null>(null);
  const gravityIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [titlePulse, setTitlePulse] = useState(false);
  const [bonusMessage, setBonusMessage] = useState<{ show: boolean; text: string }>({ show: false, text: '' });
  const [isSaving, setIsSaving] = useState(false);
  const [pulseValue, setPulseValue] = useState(0);
  const [history, setHistory] = useState<GameState[]>([]);

  // Rotation
  const [rotation, setRotation] = useState<Rotation>(0);
  const [blocksPlaced, setBlocksPlaced] = useState(0);
  const blocksUntilRotation = useRef<number>(Math.floor(Math.random() * 5) + 1);
  const [rotationPending, setRotationPending] = useState(false);
  const [needsRespawnAfterRotation, setNeedsRespawnAfterRotation] = useState(false);

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
    setTimeout(() => {
      setRotationPending(false);
      if (needsRespawnAfterRotation) {
        setNeedsRespawnAfterRotation(false);
        spawnNewPiece();
      }
    }, 450);
  };

  const checkAndRotate = () => {
    setBlocksPlaced(prev => {
      const newCount = prev + 1;
      if (newCount >= blocksUntilRotation.current) {
        blocksUntilRotation.current = Math.floor(Math.random() * 5) + 1;
        setRotationPending(true);
        changeRotationRandom();
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

  const getCenterSpawnPosition = (pieceShape: number[][]): { x: number; y: number } | null => {
    const pieceWidth = pieceShape[0].length;
    const pieceHeight = pieceShape.length;
    const startX = Math.floor((BOARD_WIDTH - pieceWidth) / 2);
    const startY = Math.floor((BOARD_HEIGHT - pieceHeight) / 2);
    for (let dy = -2; dy <= 2; dy++) {
      for (let dx = -2; dx <= 2; dx++) {
        const testX = startX + dx;
        const testY = startY + dy;
        if (testX >= 0 && testX + pieceWidth <= BOARD_WIDTH &&
            testY >= 0 && testY + pieceHeight <= BOARD_HEIGHT &&
            !collision(pieceShape, testX, testY)) {
          return { x: testX, y: testY };
        }
      }
    }
    return null;
  };

  const spawnNewPiece = () => {
    if (rotationPending) {
      setNeedsRespawnAfterRotation(true);
      return;
    }
    const isPowerUpSpawn = Math.random() < 0.15;
    const pool = isPowerUpSpawn ? POWERUP_TETROMINOS : TETROMINOS;
    const random = Math.floor(Math.random() * pool.length);
    const piece = JSON.parse(JSON.stringify(pool[random]));
    const spawnPos = getCenterSpawnPosition(piece.shape);
    if (!spawnPos) {
      endGame();
      return;
    }
    setCurrentPiece(piece);
    setPieceX(spawnPos.x);
    setPieceY(spawnPos.y);
  };

  // ========== EINFACHE, ROBUSTE GRAVITÄT (spaltenweise nach unten) ==========
  const applyGravity = (currentBoard: any[][]) => {
    for (let x = 0; x < BOARD_WIDTH; x++) {
      const columnBlocks: any[] = [];
      for (let y = BOARD_HEIGHT - 1; y >= 0; y--) {
        if (currentBoard[y][x] !== null) {
          columnBlocks.push(currentBoard[y][x]);
          currentBoard[y][x] = null;
        }
      }
      for (let i = 0; i < columnBlocks.length; i++) {
        currentBoard[BOARD_HEIGHT - 1 - i][x] = columnBlocks[i];
      }
    }
    return currentBoard;
  };

  // ========== POWER-UP EFFEKTE ==========
  const triggerPowerUpEffect = async (effect: string, x: number, y: number) => {
    setActivePowerUp(effect.toUpperCase());
    showBonus(`✨ ${effect.toUpperCase()} AKTIVIERT! ✨`);
    
    for (let i = 0; i < 30; i++) {
      setTimeout(() => {
        burstParticles(x * cellSize + cellSize/2, y * cellSize + cellSize/2, 1);
      }, i * 20);
    }

    switch (effect) {
      case 'bomb': {
        const newBoard = board.map(row => [...row]);
        for (let dy = -2; dy <= 2; dy++) {
          for (let dx = -2; dx <= 2; dx++) {
            const nx = x + dx, ny = y + dy;
            if (nx >= 0 && nx < BOARD_WIDTH && ny >= 0 && ny < BOARD_HEIGHT && newBoard[ny][nx] !== null) {
              newBoard[ny][nx] = null;
              burstParticles(nx * cellSize + cellSize/2, ny * cellSize + cellSize/2, 5);
            }
          }
        }
        setBoard(applyGravity(newBoard));
        break;
      }
      case 'laser': {
        const newBoard = board.map(row => [...row]);
        for (let col = 0; col < BOARD_WIDTH; col++) {
          if (newBoard[y][col] !== null) {
            newBoard[y][col] = null;
            burstParticles(col * cellSize + cellSize/2, y * cellSize + cellSize/2, 3);
          }
        }
        setBoard(applyGravity(newBoard));
        break;
      }
      case 'colorBlast': {
        const colors = ['#FF8844', '#FFDD44', '#FF6666', '#AAAAAA', '#EEEEEE', '#5588FF', '#55DD88', 
                        '#FF9999', '#FFAAFF', '#FFEECC', '#FFDD88', '#AAFFFF', '#CCFFCC', '#FFCCDD', '#DDDDFF', '#FFDDCC', '#FFCCFF'];
        const randomColor = colors[Math.floor(Math.random() * colors.length)];
        const newBoard = board.map(row => 
          row.map(cell => {
            if (cell && cell.color === randomColor) {
              burstParticles(Math.random() * BOARD_WIDTH * cellSize, Math.random() * BOARD_HEIGHT * cellSize, 2);
              return null;
            }
            return cell;
          })
        );
        setBoard(applyGravity(newBoard));
        break;
      }
      case 'scndBonus':
        setScndBonusActive(true);
        setTimeout(() => setScndBonusActive(false), 30000);
        break;
      case 'freeze':
        setFreezeMode(true);
        setTimeout(() => setFreezeMode(false), 3000);
        break;
      case 'gravity': {
        const newBoard = applyGravity(board.map(row => [...row]));
        setBoard(newBoard);
        break;
      }
      case 'swap': {
        const blocks: {y: number, x: number, block: any}[] = [];
        for (let y = 0; y < BOARD_HEIGHT; y++) {
          for (let x = 0; x < BOARD_WIDTH; x++) {
            if (board[y][x] !== null) blocks.push({y, x, block: board[y][x]});
          }
        }
        if (blocks.length >= 2) {
          const a = blocks[Math.floor(Math.random() * blocks.length)];
          let b = blocks[Math.floor(Math.random() * blocks.length)];
          while (a === b) b = blocks[Math.floor(Math.random() * blocks.length)];
          const newBoard = board.map(row => [...row]);
          newBoard[a.y][a.x] = b.block;
          newBoard[b.y][b.x] = a.block;
          setBoard(newBoard);
          burstParticles(a.x * cellSize + cellSize/2, a.y * cellSize + cellSize/2, 10);
          burstParticles(b.x * cellSize + cellSize/2, b.y * cellSize + cellSize/2, 10);
        }
        break;
      }
      case 'clearLine': {
        const row = Math.floor(Math.random() * BOARD_HEIGHT);
        const newBoard = board.map(row => [...row]);
        for (let col = 0; col < BOARD_WIDTH; col++) {
          if (newBoard[row][col] !== null) {
            newBoard[row][col] = null;
            burstParticles(col * cellSize + cellSize/2, row * cellSize + cellSize/2, 3);
          }
        }
        setBoard(applyGravity(newBoard));
        break;
      }
      case 'fastForward':
        setFastForwardActive(true);
        setTimeout(() => setFastForwardActive(false), 5000);
        break;
      case 'randomize': {
        const allBlocks: any[] = [];
        for (let y = 0; y < BOARD_HEIGHT; y++) {
          for (let x = 0; x < BOARD_WIDTH; x++) {
            if (board[y][x] !== null) allBlocks.push(board[y][x]);
          }
        }
        for (let i = allBlocks.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [allBlocks[i], allBlocks[j]] = [allBlocks[j], allBlocks[i]];
        }
        const newBoard = Array(BOARD_HEIGHT).fill(null).map(() => Array(BOARD_WIDTH).fill(null));
        let idx = 0;
        for (let y = 0; y < BOARD_HEIGHT && idx < allBlocks.length; y++) {
          for (let x = 0; x < BOARD_WIDTH && idx < allBlocks.length; x++) {
            newBoard[y][x] = allBlocks[idx++];
          }
        }
        setBoard(applyGravity(newBoard));
        for (let i = 0; i < 100; i++) {
          setTimeout(() => {
            burstParticles(Math.random() * BOARD_WIDTH * cellSize, Math.random() * BOARD_HEIGHT * cellSize, 1);
          }, i * 10);
        }
        break;
      }
      case 'clone': {
        if (!currentPiece) break;
        const pieceShape = currentPiece.shape;
        const pieceWidth = pieceShape[0].length;
        const pieceHeight = pieceShape.length;
        for (let attempt = 0; attempt < 50; attempt++) {
          const randX = Math.floor(Math.random() * (BOARD_WIDTH - pieceWidth + 1));
          const randY = Math.floor(Math.random() * (BOARD_HEIGHT - pieceHeight + 1));
          if (!collision(pieceShape, randX, randY)) {
            const newBoard = board.map(row => [...row]);
            for (let y = 0; y < pieceHeight; y++) {
              for (let x = 0; x < pieceWidth; x++) {
                if (pieceShape[y][x] !== 0) {
                  newBoard[randY + y][randX + x] = {
                    color: currentPiece.color,
                    borderColor: currentPiece.borderColor,
                    isPowerUp: false,
                    powerUpEffect: null,
                    glowColor: null
                  };
                }
              }
            }
            setBoard(newBoard);
            break;
          }
        }
        break;
      }
      case 'slowMo':
        setSlowMode(true);
        setTimeout(() => setSlowMode(false), 10000);
        break;
      case 'antiGravity':
        setAntiGravityActive(true);
        setTimeout(() => setAntiGravityActive(false), 5000);
        break;
      case 'rainbow': {
        const colors = ['#FF0000', '#FF8800', '#FFFF00', '#88FF00', '#00FF88', '#0088FF', '#8800FF', '#FF00FF'];
        const newBoard = board.map(row => 
          row.map(cell => {
            if (cell) {
              const randomColor = colors[Math.floor(Math.random() * colors.length)];
              return { ...cell, color: randomColor };
            }
            return cell;
          })
        );
        setBoard(newBoard);
        break;
      }
      case 'megaBomb': {
        const newBoard = board.map(row => [...row]);
        for (let dy = -3; dy <= 3; dy++) {
          for (let dx = -3; dx <= 3; dx++) {
            const nx = x + dx, ny = y + dy;
            if (nx >= 0 && nx < BOARD_WIDTH && ny >= 0 && ny < BOARD_HEIGHT && newBoard[ny][nx] !== null) {
              newBoard[ny][nx] = null;
              burstParticles(nx * cellSize + cellSize/2, ny * cellSize + cellSize/2, 8);
            }
          }
        }
        setBoard(applyGravity(newBoard));
        break;
      }
      case 'shield':
        setShieldActive(true);
        setTimeout(() => setShieldActive(false), 10000);
        break;
      case 'doubleScore':
        setDoubleScoreActive(true);
        setTimeout(() => setDoubleScoreActive(false), 10000);
        break;
      case 'cleanse':
        setSlowMode(false);
        setFreezeMode(false);
        setFastForwardActive(false);
        setAntiGravityActive(false);
        setScndBonusActive(false);
        setDoubleScoreActive(false);
        setShieldActive(false);
        showBonus('🧹 ALLE BONUS ENTFERNT!');
        break;
      case 'rewind': {
        if (history.length > 0) {
          const lastState = history[history.length - 1];
          setBoard(lastState.board);
          setScore(lastState.score);
          setLinesCleared(lastState.linesCleared);
          setLevel(lastState.level);
          setCombo(lastState.combo);
          setHistory(prev => prev.slice(0, -1));
          showBonus('⏪ ZEITREISE!');
        } else {
          showBonus('⏪ KEINE GESCHICHTE!');
        }
        break;
      }
      case 'meteor': {
        const meteorX = Math.floor(Math.random() * BOARD_WIDTH);
        const newBoard = board.map(row => [...row]);
        for (let dy = 0; dy < BOARD_HEIGHT; dy++) {
          const ny = dy;
          if (newBoard[ny][meteorX] !== null) {
            newBoard[ny][meteorX] = null;
            burstParticles(meteorX * cellSize + cellSize/2, ny * cellSize + cellSize/2, 10);
          }
        }
        setBoard(applyGravity(newBoard));
        break;
      }
      default: break;
    }
    setTimeout(() => setActivePowerUp(null), 2000);
  };

  // ========== LINIENLÖSCHUNG mit speziellen Blöcken ==========
  const clearLineGroups = (newBoard: any[][]): { rowsCleared: number; extraScore: number } => {
    let totalCleared = 0;
    let extraScore = 0;
    const deleteChain = (cells: [number, number][]) => {
      for (const [y, x] of cells) {
        const cell = newBoard[y][x];
        if (cell) {
          if (cell.isIce && !cell.hit) {
            cell.hit = true;
            newBoard[y][x] = { ...cell, hit: true };
            burstParticles(x * cellSize + cellSize/2, y * cellSize + cellSize/2, 3);
            continue;
          }
          if (cell.isPoison) extraScore -= 200;
          if (cell.isGold) extraScore += 500;
          if (cell.isTeleporter) {
            const otherBlocks: {y: number, x: number}[] = [];
            for (let yy = 0; yy < BOARD_HEIGHT; yy++) {
              for (let xx = 0; xx < BOARD_WIDTH; xx++) {
                if ((yy !== y || xx !== x) && newBoard[yy][xx] !== null) {
                  otherBlocks.push({y: yy, x: xx});
                }
              }
            }
            if (otherBlocks.length > 0) {
              const other = otherBlocks[Math.floor(Math.random() * otherBlocks.length)];
              const temp = newBoard[other.y][other.x];
              newBoard[other.y][other.x] = cell;
              newBoard[y][x] = temp;
              burstParticles(x * cellSize + cellSize/2, y * cellSize + cellSize/2, 10);
              burstParticles(other.x * cellSize + cellSize/2, other.y * cellSize + cellSize/2, 10);
              continue;
            }
          }
          newBoard[y][x] = null;
          burstParticles(x * cellSize + cellSize/2, y * cellSize + cellSize/2, 5);
        }
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
    // Diagonal
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

    applyGravity(newBoard);
    return { rowsCleared: totalCleared, extraScore };
  };

  const burstParticles = (cx: number, cy: number, count: number) => {
    for (let i = 0; i < count; i++) {
      const offX = (Math.random() - 0.5) * cellSize * 3;
      const offY = (Math.random() - 0.5) * cellSize * 3;
      setParticles(prev => [...prev, { x: cx + offX, y: cy + offY, life: 1 }]);
    }
  };

  const mergePiece = () => {
    if (!currentPiece) return;
    const currentState: GameState = {
      board: board.map(row => [...row]),
      score,
      linesCleared,
      level,
      combo
    };
    setHistory(prev => [...prev.slice(-4), currentState]);

    let newBoard = board.map(row => [...row]);
    const powerUpBlocks: { x: number; y: number; effect: string }[] = [];

    for (let y = 0; y < currentPiece.shape.length; y++) {
      for (let x = 0; x < currentPiece.shape[y].length; x++) {
        if (currentPiece.shape[y][x] !== 0) {
          const boardX = pieceX + x, boardY = pieceY + y;
          if (boardY >= 0 && boardY < BOARD_HEIGHT && boardX >= 0 && boardX < BOARD_WIDTH) {
            const block = {
              color: currentPiece.color,
              borderColor: currentPiece.borderColor,
              isPowerUp: currentPiece.isPowerUp || false,
              powerUpEffect: currentPiece.powerUpEffect,
              glowColor: currentPiece.glowColor,
              isIce: !currentPiece.isPowerUp && Math.random() < 0.05,
              isPoison: !currentPiece.isPowerUp && Math.random() < 0.03,
              isGold: !currentPiece.isPowerUp && Math.random() < 0.04,
              isTeleporter: !currentPiece.isPowerUp && Math.random() < 0.02,
              hit: false
            };
            newBoard[boardY][boardX] = block;
            if (block.isPowerUp) powerUpBlocks.push({ x: boardX, y: boardY, effect: block.powerUpEffect });
          }
        }
      }
    }

    const { rowsCleared, extraScore } = clearLineGroups(newBoard);

    for (const block of powerUpBlocks) {
      triggerPowerUpEffect(block.effect, block.x, block.y);
    }

    const points = [0, 400, 1000, 3000, 12000];
    let addedScore = points[Math.min(rowsCleared, 4)] + extraScore;
    if (rowsCleared > 0) {
      const newCombo = combo + 1;
      setCombo(newCombo);
      let multiplier = 1 + newCombo * 0.3;
      if (scndBonusActive) multiplier *= 3;
      if (doubleScoreActive) multiplier *= 2;
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
    spawnNewPiece();
  };

  const movePiece = (screenDx: number, screenDy: number) => {
    if (!currentPiece || gameOver || isPaused || rotationPending) return;
    // freezeMode blockiert die Bewegung nicht – das wäre ein Bug. Aber wir lassen es erstmal so, weil freezeMode soll stoppen.
    // Wenn freezeMode aktiv ist, soll der Block nicht fallen – das ist gewünscht.
    if (freezeMode) return;
    const { dx, dy } = translateMove(screenDx, screenDy);
    const newX = pieceX + dx;
    const newY = pieceY + dy;
    let wouldCollide = false;
    if (shieldActive) {
      for (let y = 0; y < currentPiece.shape.length; y++) {
        for (let x = 0; x < currentPiece.shape[y].length; x++) {
          if (currentPiece.shape[y][x] !== 0) {
            const boardX = newX + x, boardY = newY + y;
            if (boardX < 0 || boardX >= BOARD_WIDTH || boardY >= BOARD_HEIGHT || boardY < 0) {
              wouldCollide = true;
              break;
            }
          }
        }
      }
    } else {
      wouldCollide = collision(currentPiece.shape, newX, newY);
    }
    if (!wouldCollide) {
      setPieceX(newX);
      setPieceY(newY);
    } else if (screenDy === 1) {
      mergePiece();
    }
  };

  const rotatePiece = () => {
    if (!currentPiece || gameOver || freezeMode || isPaused || rotationPending) return;
    const rotated = currentPiece.shape[0].map((_: any, idx: number) => 
      currentPiece.shape.map((row: any[]) => row[idx]).reverse()
    );
    let wouldCollide = shieldActive ? false : collision(rotated, pieceX, pieceY);
    if (!wouldCollide) {
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
  }, [currentPiece, pieceX, pieceY, board, gameOver, freezeMode, isPaused, rotationPending, shieldActive]);

  const getFallDelay = () => {
    if (freezeMode) return Infinity;
    let delay = Math.max(150, 800 - (level - 1) * 50);
    if (slowMode) delay *= 2;
    if (fastForwardActive) delay /= 2;
    return delay;
  };

  // ========== GAME LOOP (fallender Block) – freezeMode blockiert den Loop ==========
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
        movePiece(0, 1);
        lastFall = now;
      }
      gameLoopRef.current = requestAnimationFrame(step);
    };
    gameLoopRef.current = requestAnimationFrame(step);
    return () => { if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current); };
  }, [isPlaying, gameOver, freezeMode, isPaused, level, slowMode, fastForwardActive, currentPiece, rotationPending, shieldActive]);

  // ========== DAUERHAFTE GRAVITY (nur für gelegte Blöcke, läuft auch bei freezeMode? Nein – freezeMode stoppt alles) ==========
  useEffect(() => {
    if (isPlaying && !gameOver && !isPaused && !freezeMode) {
      if (gravityIntervalRef.current) clearInterval(gravityIntervalRef.current);
      gravityIntervalRef.current = setInterval(() => {
        setBoard(prevBoard => applyGravity(prevBoard.map(row => [...row])));
      }, 200);
    } else {
      if (gravityIntervalRef.current) clearInterval(gravityIntervalRef.current);
    }
    return () => { if (gravityIntervalRef.current) clearInterval(gravityIntervalRef.current); };
  }, [isPlaying, gameOver, isPaused, freezeMode]);

  // ========== PULSIEREN ==========
  useEffect(() => {
    let animFrame: number;
    const step = () => {
      setPulseValue(Date.now() * 0.008);
      animFrame = requestAnimationFrame(step);
    };
    if (isPlaying && !gameOver && !isPaused) animFrame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animFrame);
  }, [isPlaying, gameOver, isPaused]);

  // ========== PARTIKEL LEBENSDAUER ==========
  useEffect(() => {
    if (particles.length === 0) return;
    const interval = setInterval(() => {
      setParticles(prev => prev.filter(p => p.life > 0).map(p => ({ ...p, life: p.life - 0.05 })));
    }, 30);
    return () => clearInterval(interval);
  }, [particles]);

  // ========== SCROLL-VERHALTEN ==========
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

  const endGame = () => {
    setGameOver(true);
    setFinalScore(score);
    setIsPlaying(false);
    setIsPaused(false);
    if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    if (gravityIntervalRef.current) clearInterval(gravityIntervalRef.current);
    if (!showNameInput && !isSaving) {
      const isHighscore = highscores.length < 3 || score > (highscores[2]?.score || 0);
      if (score > 0 && isHighscore) {
        setShowNameInput(true);
        setNewHighscoreGlow(true);
        setTimeout(() => setNewHighscoreGlow(false), 2000);
      }
    }
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
    setAntiGravityActive(false);
    setDoubleScoreActive(false);
    setShieldActive(false);
    setGameOver(false);
    setShowNameInput(false);
    setParticles([]);
    setIsPaused(false);
    setIsSaving(false);
    setHistory([]);
    setBlocksPlaced(0);
    setNeedsRespawnAfterRotation(false);
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
      if (collision(currentPiece.shape, nextX, nextY)) break;
      testX = nextX;
      testY = nextY;
    }
    return { x: testX, y: testY };
  };

  // Canvas zeichnen (hier aus Platzgründen stark gekürzt – bitte deinen funktionierenden Zeichen-Code übernehmen)
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
          } else if (cell.isIce) {
            ctx.fillStyle = '#AADDFF';
            ctx.font = `bold ${Math.max(12, cellSize * 0.4)}px monospace`;
            ctx.fillText('❄️', x * cellSize + cellSize * 0.65, y * cellSize + cellSize * 0.8);
          } else if (cell.isPoison) {
            ctx.fillStyle = '#AAFFAA';
            ctx.font = `bold ${Math.max(12, cellSize * 0.4)}px monospace`;
            ctx.fillText('☠️', x * cellSize + cellSize * 0.65, y * cellSize + cellSize * 0.8);
          } else if (cell.isGold) {
            ctx.fillStyle = '#FFDD88';
            ctx.font = `bold ${Math.max(12, cellSize * 0.4)}px monospace`;
            ctx.fillText('💰', x * cellSize + cellSize * 0.65, y * cellSize + cellSize * 0.8);
          } else if (cell.isTeleporter) {
            ctx.fillStyle = '#FF88FF';
            ctx.font = `bold ${Math.max(12, cellSize * 0.4)}px monospace`;
            ctx.fillText('🌀', x * cellSize + cellSize * 0.65, y * cellSize + cellSize * 0.8);
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
  }, [board, currentPiece, pieceX, pieceY, gameOver, flashRow, flashCol, combo, cellSize, hotStreak, scndMode, scndBonusActive, freezeMode, fastForwardActive, particles, linesCleared, activePowerUp, isPaused, pulseValue, rotation, rotationPending, shieldActive]);

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
          {slowMode && <span className="inline-flex items-center gap-0.5 px-1 py-0.5 bg-[#00FFFF]/20 text-[#00FFFF] text-[7px] rounded-full">🐢 SLOW</span>}
          {freezeMode && <span className="inline-flex items-center gap-0.5 px-1 py-0.5 bg-[#00FFFF]/20 text-[#00FFFF] text-[7px] rounded-full animate-pulse">❄️ FREEZE</span>}
          {fastForwardActive && <span className="inline-flex items-center gap-0.5 px-1 py-0.5 bg-[#FF9966]/20 text-[#FF9966] text-[7px] rounded-full animate-pulse">⏩ FAST</span>}
          {scndBonusActive && <span className="inline-flex items-center gap-0.5 px-1 py-0.5 bg-[#FFD700]/20 text-[#FFD700] text-[7px] rounded-full animate-pulse">⭐ 3x</span>}
          {doubleScoreActive && <span className="inline-flex items-center gap-0.5 px-1 py-0.5 bg-[#FFDD88]/20 text-[#FFDD88] text-[7px] rounded-full animate-pulse">💰 2x</span>}
          {shieldActive && <span className="inline-flex items-center gap-0.5 px-1 py-0.5 bg-[#CCCCFF]/20 text-[#CCCCFF] text-[7px] rounded-full animate-pulse">🛡️ SHIELD</span>}
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

      <div ref={gameContainerRef} className="flex-1 flex flex-col md:flex-row gap-2 md:gap-4 justify-center items-center md:items-start px-2 py-1">
        <div className="flex justify-center items-center w-full md:w-auto">
          <div className="relative w-full max-w-full">
            <div className="absolute -inset-1 bg-gradient-to-r from-[#FF4400]/30 to-[#FF6600]/30 rounded-lg blur-lg opacity-50"></div>
            <canvas
              ref={canvasRef}
              className="relative border-2 md:border-4 border-[#FF4400] rounded-lg shadow-2xl w-full h-auto"
              style={{
                width: '100%',
                height: 'auto',
                aspectRatio: `${BOARD_WIDTH} / ${BOARD_HEIGHT}`,
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

        {/* Rechte Seitenleiste (vereinfacht) */}
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
