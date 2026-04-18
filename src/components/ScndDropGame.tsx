// src/components/ScndDropGame.tsx
'use client';

import { useEffect, useRef, useState } from 'react';

// SPIELFELD 10x20
const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;
const getCellSize = () => {
  if (typeof window === 'undefined') return 32;
  if (window.innerWidth < 640) return 24;
  if (window.innerWidth < 768) return 28;
  return 32;
};

// TETROMINOS (Standardformen)
const TETROMINOS = [
  { shape: [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]], color: '#FF4400', borderColor: '#CC3300', name: 'I', isBrand: true },
  { shape: [[0,0,0,0],[0,1,1,0],[0,1,1,0],[0,0,0,0]], color: '#FFD700', borderColor: '#CCAA00', name: 'O', isBrand: false },
  { shape: [[0,0,0,0],[0,1,0,0],[1,1,1,0],[0,0,0,0]], color: '#CC0000', borderColor: '#990000', name: 'T', isBrand: false },
  { shape: [[0,0,0,0],[0,1,1,0],[1,1,0,0],[0,0,0,0]], color: '#1A1A1A', borderColor: '#333333', name: 'S', isBrand: false },
  { shape: [[0,0,0,0],[1,1,0,0],[0,1,1,0],[0,0,0,0]], color: '#F5F5F5', borderColor: '#CCCCCC', name: 'Z', isBrand: false },
  { shape: [[0,0,0,0],[1,0,0,0],[1,1,1,0],[0,0,0,0]], color: '#0055A4', borderColor: '#004080', name: 'L', isBrand: false },
  { shape: [[0,0,0,0],[0,0,1,0],[1,1,1,0],[0,0,0,0]], color: '#00A86B', borderColor: '#008050', name: 'J', isBrand: false }
];

// POWER-UPS mit Pixel-Mustern
const POWERUPS = [
  { name: '💣', fullName: 'BOMBE', color: '#FF4444', bgColor: '#FF4444', effect: 'bomb', chance: 30, retroIcon: '💣' },
  { name: '⚡', fullName: 'LASER', color: '#FF00FF', bgColor: '#FF00FF', effect: 'laser', chance: 25, retroIcon: '⚡' },
  { name: '🎨', fullName: 'FARBE', color: '#FFD700', bgColor: '#FFD700', effect: 'colorBlast', chance: 20, retroIcon: '🎨' },
  { name: '⭐', fullName: '3x BONUS', color: '#FFAA00', bgColor: '#FFAA00', effect: 'scndBonus', chance: 15, retroIcon: '⭐' },
  { name: '⏰', fullName: 'FREEZE', color: '#00FFFF', bgColor: '#00FFFF', effect: 'freeze', chance: 10, retroIcon: '⏰' }
];

interface Highscore {
  player_name: string;
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
  const [freezeMode, setFreezeMode] = useState(false);
  const [scndBonusActive, setScndBonusActive] = useState(false);
  const [activePowerUp, setActivePowerUp] = useState<string | null>(null);
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);
  const powerUpLoopRef = useRef<NodeJS.Timeout | null>(null);
  const [titlePulse, setTitlePulse] = useState(false);
  const [bonusMessage, setBonusMessage] = useState<{ show: boolean; text: string }>({ show: false, text: '' });

  // Verhindere Scrollen auf Handy während des Spiels
  useEffect(() => {
    if (isPlaying && !gameOver) {
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
      return () => {
        document.body.style.overflow = '';
        document.body.style.touchAction = '';
      };
    }
  }, [isPlaying, gameOver]);

  useEffect(() => {
    const handleResize = () => setCellSize(getCellSize());
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // HIGHSCORES AUS SUPABASE LADEN
  useEffect(() => {
    const loadHighscores = async () => {
      try {
        const res = await fetch('/api/game-highscores');
        const data = await res.json();
        if (Array.isArray(data)) {
          setHighscores(data);
        }
      } catch (error) {
        console.error('Fehler beim Laden der Highscores:', error);
      }
    };
    loadHighscores();
  }, []);

  const getFallDelay = () => {
    if (freezeMode) return Infinity;
    let delay = Math.max(80, 300 - (level - 1) * 25);
    if (slowMode) delay = delay * 2;
    return delay;
  };

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
    setGameOver(false);
    setShowNameInput(false);
    setParticles([]);
    setPowerUp(null);
    spawnNewPiece();
    setIsPlaying(true);
    if (powerUpLoopRef.current) clearInterval(powerUpLoopRef.current);
    powerUpLoopRef.current = setInterval(spawnPowerUp, 8000);
  };

  const giveUp = () => {
    if (isPlaying && !gameOver) {
      setGameOver(true);
      setFinalScore(score);
      setIsPlaying(false);
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
      if (powerUpLoopRef.current) clearInterval(powerUpLoopRef.current);
      
      const isHighscore = highscores.length < 3 || score > (highscores[2]?.score || 0);
      if (score > 0 && isHighscore) {
        setShowNameInput(true);
        setNewHighscoreGlow(true);
        setTimeout(() => setNewHighscoreGlow(false), 2000);
      }
    }
  };

  const spawnPowerUp = () => {
    if (!isPlaying || gameOver) return;
    if (powerUp) return;
    
    const random = Math.random() * 100;
    let cumulative = 0;
    
    for (const pu of POWERUPS) {
      cumulative += pu.chance;
      if (random <= cumulative) {
        setPowerUp(pu);
        setPowerUpX(Math.floor(Math.random() * BOARD_WIDTH));
        setPowerUpY(0);
        break;
      }
    }
  };

  const applyPowerUp = (effect: string, powerItem: any) => {
    setActivePowerUp(powerItem.fullName);
    showBonus(`✨ ${powerItem.fullName} AKTIVIERT! ✨`);
    
    switch(effect) {
      case 'bomb':
        const bombBoard = board.map(row => [...row]);
        for (let dy = -2; dy <= 2; dy++) {
          for (let dx = -2; dx <= 2; dx++) {
            const x = powerUpX + dx, y = powerUpY + dy;
            if (x >= 0 && x < BOARD_WIDTH && y >= 0 && y < BOARD_HEIGHT) {
              if (bombBoard[y] && bombBoard[y][x]) {
                bombBoard[y][x] = null;
                for (let i = 0; i < 5; i++) {
                  setParticles(prev => [...prev, { x: x * cellSize + cellSize/2, y: y * cellSize + cellSize/2, life: 1 }]);
                }
              }
            }
          }
        }
        setBoard(bombBoard);
        setTimeout(() => setActivePowerUp(null), 2000);
        break;
        
      case 'laser':
        const laserBoard = board.map(row => [...row]);
        for (let x = 0; x < BOARD_WIDTH; x++) {
          if (laserBoard[powerUpY] && laserBoard[powerUpY][x]) {
            laserBoard[powerUpY][x] = null;
            setParticles(prev => [...prev, { x: x * cellSize + cellSize/2, y: powerUpY * cellSize + cellSize/2, life: 1 }]);
          }
        }
        setBoard(laserBoard);
        setTimeout(() => setActivePowerUp(null), 2000);
        break;
        
      case 'colorBlast':
        const colors = ['#FF4400', '#FFD700', '#CC0000', '#0055A4', '#00A86B', '#1A1A1A', '#F5F5F5'];
        const randomColor = colors[Math.floor(Math.random() * colors.length)];
        const colorBlastBoard = board.map(row => 
          row.map(cell => {
            if (cell && cell.color === randomColor) {
              setParticles(prev => [...prev, { x: Math.random() * BOARD_WIDTH * cellSize, y: Math.random() * BOARD_HEIGHT * cellSize, life: 1 }]);
              return null;
            }
            return cell;
          })
        );
        setBoard(colorBlastBoard);
        setTimeout(() => setActivePowerUp(null), 2000);
        break;
        
      case 'scndBonus':
        setScndBonusActive(true);
        setTimeout(() => {
          setScndBonusActive(false);
          setActivePowerUp(null);
        }, 30000);
        break;
        
      case 'freeze':
        setFreezeMode(true);
        setTimeout(() => {
          setFreezeMode(false);
          setActivePowerUp(null);
        }, 3000);
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
    
    const isHighscore = highscores.length < 3 || score > (highscores[2]?.score || 0);
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
      let multiplier = 1 + newCombo * 0.15;
      if (scndBonusActive) multiplier *= 3;
      addedScore = Math.floor(addedScore * multiplier);
      
      const hasScndColors = clearedRows.some(row => 
        newBoard[row]?.some(cell => cell?.color === '#FF4400' || cell?.color === '#1A1A1A')
      );
      if (hasScndColors) {
        addedScore = Math.floor(addedScore * 2);
        showBonus('🎨 ORANGE + SCHWARZ = 2x PUNKTE!');
      }
      
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
    if (!currentPiece || gameOver || freezeMode) return;
    if (!collision(currentPiece.shape, pieceX + dx, pieceY + dy)) {
      setPieceX(pieceX + dx);
      setPieceY(pieceY + dy);
    } else if (dy === 1) mergePiece();
  };

  const rotatePiece = () => {
    if (!currentPiece || gameOver || freezeMode) return;
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
        case 'ArrowLeft': e.preventDefault(); movePiece(-1, 0); break;
        case 'ArrowRight': e.preventDefault(); movePiece(1, 0); break;
        case 'ArrowDown': e.preventDefault(); movePiece(0, 1); break;
        case 'ArrowUp': e.preventDefault(); rotatePiece(); break;
        case 'Escape': e.preventDefault(); giveUp(); break;
        default: break;
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [currentPiece, pieceX, pieceY, board, gameOver, freezeMode]);

  // Automatischer Game Loop
  useEffect(() => {
    if (isPlaying && !gameOver && !freezeMode) {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
      gameLoopRef.current = setInterval(() => movePiece(0, 1), getFallDelay());
    }
    return () => { if (gameLoopRef.current) clearInterval(gameLoopRef.current); };
  }, [isPlaying, gameOver, currentPiece, pieceX, pieceY, board, level, slowMode, freezeMode]);

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
    
    // Power-Up Zeichnung
    if (powerUp && powerUpY < BOARD_HEIGHT) {
      const w = cellSize;
      const x = powerUpX * w;
      const y = powerUpY * w;
      
      ctx.shadowBlur = 10;
      ctx.shadowColor = powerUp.color;
      ctx.fillStyle = powerUp.bgColor;
      ctx.fillRect(x, y, w - 1, w - 1);
      
      ctx.fillStyle = '#FFFFFF';
      ctx.font = `bold ${Math.max(20, w * 0.6)}px "Segoe UI Emoji", "Apple Color Emoji", sans-serif`;
      ctx.fillText(powerUp.retroIcon, x + w * 0.25, y + w * 0.75);
      
      ctx.font = `bold ${Math.max(9, w * 0.28)}px monospace`;
      ctx.fillStyle = powerUp.color;
      ctx.fillText(powerUp.fullName, x + w * 0.1, y + w + 10);
      
      ctx.shadowBlur = 0;
      
      setPowerUpY(prev => prev + 0.06);
      
      if (powerUpY >= BOARD_HEIGHT - 0.8) {
        setPowerUp(null);
      } else {
        const pieceRow = Math.floor(powerUpY);
        if (pieceRow >= 0 && pieceRow < BOARD_HEIGHT) {
          const cell = board[pieceRow]?.[powerUpX];
          if (cell !== null && cell !== undefined) {
            applyPowerUp(powerUp.effect, powerUp);
            setPowerUp(null);
          }
        }
      }
    }
    
    if (currentPiece && !gameOver && !freezeMode) {
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
    
    ctx.fillStyle = 'rgba(0,0,0,0.06)';
    for (let i = 0; i < canvas.height; i += 2) {
      ctx.fillRect(0, i, canvas.width, 1);
    }
    
    const gradient = ctx.createRadialGradient(canvas.width/2, canvas.height/2, 0, canvas.width/2, canvas.height/2, canvas.width/2);
    gradient.addColorStop(0, 'rgba(0,0,0,0)');
    gradient.addColorStop(1, 'rgba(0,0,0,0.35)');
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
      ctx.font = `bold ${Math.max(10, cellSize * 0.45)}px monospace`;
      ctx.fillStyle = '#FF4400';
      ctx.fillText('🔥 HOT STREAK!', canvas.width - 85, 25);
    }
    if (scndMode) {
      ctx.font = `bold ${Math.max(11, cellSize * 0.5)}px monospace`;
      ctx.fillStyle = '#FF4400';
      ctx.fillText('⚡ SCND MODE!', canvas.width - 85, 50);
    }
    if (scndBonusActive) {
      ctx.font = `bold ${Math.max(10, cellSize * 0.45)}px monospace`;
      ctx.fillStyle = '#FFD700';
      ctx.fillText('⭐ 3x BONUS!', canvas.width - 85, 75);
    }
    if (freezeMode) {
      ctx.font = `bold ${Math.max(12, cellSize * 0.5)}px monospace`;
      ctx.fillStyle = '#00FFFF';
      ctx.fillText('⏰ FREEZE!', canvas.width / 2 - 40, 30);
    }
    if (activePowerUp) {
      ctx.font = `bold ${Math.max(10, cellSize * 0.45)}px monospace`;
      ctx.fillStyle = '#00FF00';
      ctx.fillText(`✨ ${activePowerUp} ✨`, canvas.width - 85, 100);
    }
    if (combo > 0) {
      ctx.font = `bold ${Math.max(10, cellSize * 0.45)}px monospace`;
      ctx.fillStyle = '#FF4400';
      ctx.fillText(`${combo}x COMBO!`, canvas.width - 70, 125);
    }
    if (popupScore) {
      ctx.font = `bold ${Math.max(14, cellSize * 0.65)}px monospace`;
      ctx.fillStyle = '#FF4400';
      ctx.fillText(`+${popupScore.score}`, popupScore.x - 20, popupScore.y);
    }
    ctx.shadowBlur = 0;
  }, [board, currentPiece, pieceX, pieceY, gameOver, flashRow, popupScore, combo, cellSize, hotStreak, scndMode, scndBonusActive, freezeMode, particles, powerUp, powerUpX, powerUpY, linesCleared, activePowerUp]);

  const saveHighscore = async () => {
    if (playerName.trim() === '') return;
    
    try {
      await fetch('/api/game-highscores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerName, score: finalScore })
      });
      
      const res = await fetch('/api/game-highscores');
      const data = await res.json();
      if (Array.isArray(data)) {
        setHighscores(data);
      }
    } catch (error) {
      console.error('Fehler beim Speichern des Highscores:', error);
    }
    
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
    <div className={`my-6 md:my-12 bg-gradient-to-br from-[var(--bg-secondary)] to-[var(--bg-primary)] rounded-2xl border-2 border-[#FF4400]/40 shadow-2xl transition-all ${newHighscoreGlow ? 'shadow-[0_0_30px_#FF4400]' : 'shadow-[0_0_15px_rgba(0,0,0,0.5)]'}`}>
      <div className="relative">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#FF4400] via-[#FFD700] to-[#FF4400] rounded-t-2xl"></div>
        
        <div className="p-4 md:p-6">
          <div className="text-center mb-6">
            <div className="inline-block">
              <h3 className={`text-2xl md:text-4xl font-black tracking-tighter bg-gradient-to-r from-[#FF4400] to-[#FF6600] bg-clip-text text-transparent transition-all duration-300 ${titlePulse && isPlaying ? 'scale-110' : ''}`}>
                SCND DROP
              </h3>
              <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-[#FF4400] to-transparent mt-1"></div>
            </div>
            <div className="flex justify-center gap-3 mt-2">
              {slowMode && <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#00FFFF]/20 text-[#00FFFF] text-[10px] rounded-full">🐌 TIME SLOW</span>}
              {freezeMode && <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#00FFFF]/20 text-[#00FFFF] text-[10px] rounded-full animate-pulse">⏰ FREEZE</span>}
              {scndBonusActive && <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#FFD700]/20 text-[#FFD700] text-[10px] rounded-full animate-pulse">⭐ 3x BONUS</span>}
              {activePowerUp && <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#00FF00]/20 text-[#00FF00] text-[10px] rounded-full animate-pulse">✨ {activePowerUp}</span>}
            </div>
            {bonusMessage.show && (
              <div className="mt-2 animate-bounce">
                <span className="inline-block px-3 py-1 bg-[#FFD700]/20 text-[#FFD700] text-[10px] md:text-xs rounded-full border border-[#FFD700]/30">
                  {bonusMessage.text}
                </span>
              </div>
            )}
          </div>

          <div className="flex flex-col md:flex-row gap-6 md:gap-8 justify-center items-center md:items-start">
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-[#FF4400]/30 to-[#FF6600]/30 rounded-lg blur-lg opacity-50"></div>
              <canvas ref={canvasRef} className="relative border-2 md:border-4 border-[#FF4400] rounded-lg shadow-2xl" style={{ width: BOARD_WIDTH * cellSize, height: BOARD_HEIGHT * cellSize }} />



{/* TOUCH CONTROLLER für Handy - asymmetrisches Dreieck + zwei rechte Tasten */}
{isPlaying && !gameOver && (
  <div 
    className="fixed bottom-4 left-0 right-0 flex justify-center items-end md:hidden z-50"
    style={{ touchAction: 'none', userSelect: 'none' }}
  >
    <div className="flex items-end gap-8">
      {/* LINKER BEREICH: Dreieck (Links, Unten, Rechts) */}
      <div className="relative flex flex-col items-center" style={{ width: '180px' }}>
        {/* Obere Reihe: Links und Rechts */}
        <div className="flex justify-between w-full mb-3">
          {/* LINKS Taste */}
          <button
            onTouchStart={(e) => { e.preventDefault(); handleMoveLeft(); }}
            className="w-16 h-16 bg-gradient-to-b from-[#1A1A1A] to-[#0A0A0A] border-2 border-[#FF4400] rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-all"
            style={{ touchAction: 'none', userSelect: 'none' }}
          >
            <span className="text-white text-3xl font-bold">◀</span>
          </button>
          {/* RECHTS Taste */}
          <button
            onTouchStart={(e) => { e.preventDefault(); handleMoveRight(); }}
            className="w-16 h-16 bg-gradient-to-b from-[#1A1A1A] to-[#0A0A0A] border-2 border-[#FF4400] rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-all"
            style={{ touchAction: 'none', userSelect: 'none' }}
          >
            <span className="text-white text-3xl font-bold">▶</span>
          </button>
        </div>
        {/* UNTEN Taste – asymmetrisch (nach rechts versetzt) */}
        <div className="flex justify-end w-full pr-4">
          <button
            onTouchStart={(e) => { e.preventDefault(); handleMoveDown(); }}
            className="w-16 h-16 bg-gradient-to-b from-[#1A1A1A] to-[#0A0A0A] border-2 border-[#FF4400] rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-all"
            style={{ touchAction: 'none', userSelect: 'none' }}
          >
            <span className="text-white text-3xl font-bold">▼</span>
          </button>
        </div>
      </div>

      {/* RECHTE SEITE: zwei Tasten schräg übereinander */}
      <div className="flex flex-col gap-4">
        {/* DREHEN Taste (oben, leicht nach rechts versetzt) */}
        <button
          onTouchStart={(e) => { e.preventDefault(); handleRotate(); }}
          className="w-16 h-16 bg-gradient-to-br from-[#FF4400] to-[#CC3300] border-2 border-white/30 rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-all ml-4"
          style={{ touchAction: 'none', userSelect: 'none' }}
        >
          <span className="text-white text-xl font-bold tracking-wider">A</span>
        </button>
        {/* AUFGABEN Taste (unten, weiter rechts) */}
        <button
          onTouchStart={(e) => { e.preventDefault(); giveUp(); }}
          className="w-16 h-16 bg-gradient-to-b from-[#333] to-[#1A1A1A] border-2 border-[#FF4400]/70 rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-all ml-8"
          style={{ touchAction: 'none', userSelect: 'none' }}
        >
          <span className="text-white text-xl font-bold">🏆</span>
        </button>
      </div>
    </div>

    {/* Beschriftung (optional) */}
    <div className="absolute -bottom-6 left-0 right-0 flex justify-center gap-12 text-[8px] text-[var(--text-secondary)] uppercase tracking-wider">
      <span>BEWEGEN</span>
      <span>DREHEN</span>
      <span>AUFGABEN</span>
    </div>
  </div>
)}
              
              {gameOver && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/80 backdrop-blur-sm rounded-lg">
                  <div className="text-center">
                    <div className="text-xl md:text-3xl font-black mb-1">
                      <span className="text-[#FF4400]">GAME</span><span className="text-white"> OVER</span>
                    </div>
                    <div className="text-lg md:text-2xl text-[#FF4400] font-bold mb-3">{finalScore} Punkte</div>
                    <div className="flex gap-3">
                      <button onClick={startGame} className="px-4 md:px-6 py-1 md:py-2 bg-gradient-to-r from-[#FF4400] to-[#FF6600] text-white font-bold uppercase tracking-wider rounded-lg text-xs md:text-sm hover:scale-105 transition-all">NEUSTART</button>
                      <button onClick={giveUp} className="px-4 md:px-6 py-1 md:py-2 border-2 border-[#FF4400] text-[#FF4400] font-bold uppercase tracking-wider rounded-lg text-xs md:text-sm hover:bg-[#FF4400]/10 transition-all">AUFGEBEN</button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-gradient-to-br from-[var(--bg-primary)] to-[#0D0D0D] rounded-xl border border-[#FF4400]/30 p-4 md:p-5 min-w-[200px] md:min-w-[240px] w-full md:w-auto shadow-xl">
              <div className="text-center mb-4 pb-3 border-b border-[#FF4400]/20">
                <div className="text-[10px] md:text-xs text-[var(--text-secondary)] uppercase tracking-wider">AKTUELLE PUNKTE</div>
                <div className="text-3xl md:text-5xl font-black text-[#FF4400] drop-shadow-[0_0_10px_rgba(255,68,0,0.5)]">{gameOver ? finalScore : score}</div>
                <div className="flex justify-center gap-4 mt-2">
                  <div className="text-center">
                    <div className="text-[8px] md:text-[10px] text-[var(--text-secondary)]">LEVEL</div>
                    <div className="text-sm md:text-base font-bold text-[#FF4400]">{level}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-[8px] md:text-[10px] text-[var(--text-secondary)]">LINIEN</div>
                    <div className="text-sm md:text-base font-bold text-[var(--text-primary)]">{linesCleared}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-[8px] md:text-[10px] text-[var(--text-secondary)]">COMBO</div>
                    <div className="text-sm md:text-base font-bold text-[#FF4400]">{combo}x</div>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2 mb-4">
                {hotStreak && (
                  <div className="bg-gradient-to-r from-[#FF4400]/20 to-transparent p-2 rounded-lg border-l-4 border-[#FF4400]">
                    <div className="text-[10px] text-[var(--text-secondary)]">🔥 STREAK</div>
                    <div className="text-xs font-bold text-[#FF4400]">HOT STREAK!</div>
                  </div>
                )}
                {scndMode && (
                  <div className="bg-gradient-to-r from-[#FF4400]/20 to-transparent p-2 rounded-lg border-l-4 border-[#FF4400]">
                    <div className="text-[10px] text-[var(--text-secondary)]">⚡ MODUS</div>
                    <div className="text-xs font-bold text-[#FF4400]">SCND MODE!</div>
                  </div>
                )}
                {scndBonusActive && (
                  <div className="bg-gradient-to-r from-[#FFD700]/20 to-transparent p-2 rounded-lg border-l-4 border-[#FFD700]">
                    <div className="text-[10px] text-[var(--text-secondary)]">⭐ BONUS</div>
                    <div className="text-xs font-bold text-[#FFD700]">3x PUNKTE!</div>
                  </div>
                )}
              </div>
              
              <div className="bg-[var(--bg-secondary)]/50 rounded-xl p-3 mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-1 h-4 bg-[#FF4400] rounded-full"></div>
                  <h4 className="font-bold text-xs uppercase tracking-wider text-[#FF4400]">🏆 BESTENLISTE TOP 3</h4>
                </div>
                <ul className="space-y-1">
                  {highscores.map((hs, idx) => (
                    <li key={idx} className="flex justify-between items-center bg-[var(--bg-primary)]/50 rounded-lg px-3 py-1.5">
                      <span className="flex items-center gap-2">
                        <span className="text-base md:text-lg">{rankIcon(idx)}</span>
                        <span className="text-xs md:text-sm font-medium truncate max-w-[80px] md:max-w-[100px]">{hs.player_name}</span>
                      </span>
                      <span className="text-xs md:text-sm text-[#FF4400] font-bold">{hs.score}</span>
                    </li>
                  ))}
                  {highscores.length === 0 && (
                    <li className="text-center text-[10px] md:text-xs text-[var(--text-secondary)] py-2 italic">— noch keine Einträge —</li>
                  )}
                </ul>
              </div>
              
              <div className="text-center pt-2 border-t border-[#FF4400]/20">
                <div className="text-[8px] md:text-[10px] text-[var(--text-secondary)] uppercase tracking-wider">STEUERUNG</div>
                <div className="flex justify-center gap-3 mt-1">
                  <kbd className="px-2 py-1 bg-black/50 rounded text-xs font-mono text-[#FF4400]">← → ↓</kbd>
                  <kbd className="px-2 py-1 bg-black/50 rounded text-xs font-mono text-[#FF4400]">↑</kbd>
                  <kbd className="px-2 py-1 bg-black/50 rounded text-xs font-mono text-[var(--text-secondary)]">DREHEN</kbd>
                </div>
                <div className="flex justify-center gap-3 mt-1">
                  <kbd className="px-2 py-0.5 bg-black/50 rounded text-[8px] font-mono text-[var(--text-secondary)]">ESC</kbd>
                  <span className="text-[8px] text-[var(--text-secondary)]">AUFGEBEN</span>
                </div>
                <div className="mt-2 flex flex-wrap justify-center gap-1">
                  <span className="inline-block w-2 h-2 rounded-full bg-[#FF4400]"></span>
                  <span className="text-[7px] md:text-[8px] text-[var(--text-secondary)]">POWER-UPS alle 8 Sek.</span>
                  <span className="inline-block w-2 h-2 rounded-full bg-[#FFD700] ml-1"></span>
                  <span className="text-[7px] md:text-[8px] text-[var(--text-secondary)]">ORANGE+SCHWARZ = 2x</span>
                </div>
              </div>
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
