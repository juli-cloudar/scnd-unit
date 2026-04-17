// src/components/ScndDropGame.tsx
'use client';

import { useEffect, useRef, useState } from 'react';

const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;
const CELL_SIZE = 32;

// Bauhaus-inspirierte Tetrominos
const TETROMINOS = [
  { 
    shape: [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]], 
    color: '#FF4400',  // SCND Orange
    name: 'I',
    borderColor: '#CC3300'
  },
  { 
    shape: [[0,0,0,0],[0,1,1,0],[0,1,1,0],[0,0,0,0]], 
    color: '#FFD700',  // Bauhaus Gelb
    name: 'O',
    borderColor: '#CCAA00'
  },
  { 
    shape: [[0,0,0,0],[0,1,0,0],[1,1,1,0],[0,0,0,0]], 
    color: '#CC0000',  // Bauhaus Rot
    name: 'T',
    borderColor: '#990000'
  },
  { 
    shape: [[0,0,0,0],[0,1,1,0],[1,1,0,0],[0,0,0,0]], 
    color: '#1A1A1A',  // Bauhaus Schwarz
    name: 'S',
    borderColor: '#333333'
  },
  { 
    shape: [[0,0,0,0],[1,1,0,0],[0,1,1,0],[0,0,0,0]], 
    color: '#F5F5F5',  // Bauhaus Weiß
    name: 'Z',
    borderColor: '#CCCCCC'
  },
  { 
    shape: [[0,0,0,0],[1,0,0,0],[1,1,1,0],[0,0,0,0]], 
    color: '#0055A4',  // Bauhaus Blau
    name: 'L',
    borderColor: '#004080'
  },
  { 
    shape: [[0,0,0,0],[0,0,1,0],[1,1,1,0],[0,0,0,0]], 
    color: '#00A86B',  // Bauhaus Grün
    name: 'J',
    borderColor: '#008050'
  }
];

interface Highscore {
  name: string;
  score: number;
}

export function ScndDropGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [board, setBoard] = useState<{ color: string; borderColor: string }[][]>(() => 
    Array(BOARD_HEIGHT).fill(null).map(() => Array(BOARD_WIDTH).fill(null))
  );
  const [currentPiece, setCurrentPiece] = useState<any>(null);
  const [pieceX, setPieceX] = useState(0);
  const [pieceY, setPieceY] = useState(0);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [highscores, setHighscores] = useState<Highscore[]>([]);
  const [showNameInput, setShowNameInput] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [linesCleared, setLinesCleared] = useState(0);
  const [flashRow, setFlashRow] = useState<number | null>(null);
  const [popupScore, setPopupScore] = useState<{ score: number; x: number; y: number } | null>(null);
  const [newHighscoreGlow, setNewHighscoreGlow] = useState(false);
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);
  const audioCtx = useRef<AudioContext | null>(null);

  // Sound initialisieren
  const playSound = (type: 'move' | 'rotate' | 'clear' | 'gameover') => {
    if (!audioCtx.current) {
      audioCtx.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const ctx = audioCtx.current;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    let frequency = 440;
    let duration = 0.1;
    switch(type) {
      case 'move': frequency = 440; duration = 0.05; break;
      case 'rotate': frequency = 660; duration = 0.07; break;
      case 'clear': frequency = 880; duration = 0.15; break;
      case 'gameover': frequency = 220; duration = 0.5; break;
    }
    osc.frequency.value = frequency;
    gain.gain.value = 0.1;
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + duration);
    osc.stop(ctx.currentTime + duration);
  };

  useEffect(() => {
    const saved = localStorage.getItem('scnd_block_highscores');
    if (saved) setHighscores(JSON.parse(saved));
  }, []);

  const startGame = () => {
    setBoard(Array(BOARD_HEIGHT).fill(null).map(() => Array(BOARD_WIDTH).fill(null)));
    setScore(0);
    setLinesCleared(0);
    setGameOver(false);
    setShowNameInput(false);
    spawnNewPiece();
    setIsPlaying(true);
  };

  const spawnNewPiece = () => {
    const random = Math.floor(Math.random() * TETROMINOS.length);
    const piece = JSON.parse(JSON.stringify(TETROMINOS[random]));
    setCurrentPiece(piece);
    setPieceX(Math.floor((BOARD_WIDTH - piece.shape[0].length) / 2));
    setPieceY(0);
    if (collision(piece.shape, Math.floor((BOARD_WIDTH - piece.shape[0].length) / 2), 0)) {
      setGameOver(true);
      setIsPlaying(false);
      playSound('gameover');
      const isHighscore = highscores.length < 3 || score > highscores[2]?.score;
      if (score > 0 && isHighscore) {
        setShowNameInput(true);
        setNewHighscoreGlow(true);
        setTimeout(() => setNewHighscoreGlow(false), 2000);
      }
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
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
    playSound('clear');
    const newBoard = board.map(row => [...row]);
    for (let y = 0; y < currentPiece.shape.length; y++) {
      for (let x = 0; x < currentPiece.shape[y].length; x++) {
        if (currentPiece.shape[y][x] !== 0) {
          const boardX = pieceX + x, boardY = pieceY + y;
          if (boardY >= 0 && boardY < BOARD_HEIGHT && boardX >= 0 && boardX < BOARD_WIDTH) {
            newBoard[boardY][boardX] = { color: currentPiece.color, borderColor: currentPiece.borderColor };
          }
        }
      }
    }
    let rowsCleared = 0;
    for (let row = BOARD_HEIGHT - 1; row >= 0; ) {
      if (newBoard[row].every(cell => cell !== null)) {
        setFlashRow(row);
        setTimeout(() => setFlashRow(null), 200);
        newBoard.splice(row, 1);
        newBoard.unshift(Array(BOARD_WIDTH).fill(null));
        rowsCleared++;
      } else row--;
    }
    const points = [0, 40, 100, 300, 1200];
    const addedScore = points[rowsCleared];
    const newScore = score + addedScore;
    setScore(newScore);
    if (addedScore > 0) {
      setPopupScore({ score: addedScore, x: BOARD_WIDTH * CELL_SIZE / 2, y: BOARD_HEIGHT * CELL_SIZE / 2 - 50 });
      setTimeout(() => setPopupScore(null), 500);
    }
    setLinesCleared(prev => prev + rowsCleared);
    setBoard(newBoard);
    spawnNewPiece();
  };

  const movePiece = (dx: number, dy: number) => {
    if (!currentPiece || gameOver) return;
    if (!collision(currentPiece.shape, pieceX + dx, pieceY + dy)) {
      setPieceX(pieceX + dx);
      setPieceY(pieceY + dy);
      if (dy === 0) playSound('move');
    } else if (dy === 1) mergePiece();
  };

  const rotatePiece = () => {
    if (!currentPiece || gameOver) return;
    const rotated = currentPiece.shape[0].map((_: any, idx: number) => 
      currentPiece.shape.map((row: any[]) => row[idx]).reverse()
    );
    if (!collision(rotated, pieceX, pieceY)) {
      setCurrentPiece({ ...currentPiece, shape: rotated });
      playSound('rotate');
    }
  };

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (gameOver) return;
      if (e.key === 'ArrowLeft') movePiece(-1, 0);
      if (e.key === 'ArrowRight') movePiece(1, 0);
      if (e.key === 'ArrowDown') movePiece(0, 1);
      if (e.key === 'ArrowUp') rotatePiece();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [currentPiece, pieceX, pieceY, board, gameOver]);

  useEffect(() => {
    if (isPlaying && !gameOver) {
      gameLoopRef.current = setInterval(() => movePiece(0, 1), 450);
    }
    return () => { if (gameLoopRef.current) clearInterval(gameLoopRef.current); };
  }, [isPlaying, gameOver, currentPiece, pieceX, pieceY, board]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.width = BOARD_WIDTH * CELL_SIZE;
    canvas.height = BOARD_HEIGHT * CELL_SIZE;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Spielfeld-Hintergrund
    ctx.fillStyle = 'var(--bg-secondary)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Gitterlinien
    ctx.strokeStyle = '#FF44004D';
    ctx.lineWidth = 1;
    for (let x = 0; x <= BOARD_WIDTH; x++) {
      ctx.beginPath();
      ctx.moveTo(x * CELL_SIZE, 0);
      ctx.lineTo(x * CELL_SIZE, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y <= BOARD_HEIGHT; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * CELL_SIZE);
      ctx.lineTo(canvas.width, y * CELL_SIZE);
      ctx.stroke();
    }
    
    // Blöcke zeichnen
    for (let y = 0; y < BOARD_HEIGHT; y++) {
      for (let x = 0; x < BOARD_WIDTH; x++) {
        const cell = board[y][x];
        if (cell) {
          ctx.fillStyle = cell.color;
          ctx.fillRect(x * CELL_SIZE + 1, y * CELL_SIZE + 1, CELL_SIZE - 2, CELL_SIZE - 2);
          ctx.fillStyle = cell.borderColor;
          ctx.fillRect(x * CELL_SIZE + 1, y * CELL_SIZE + 1, CELL_SIZE - 2, 2);
          ctx.fillRect(x * CELL_SIZE + 1, y * CELL_SIZE + 1, 2, CELL_SIZE - 2);
        }
        if (flashRow === y) {
          ctx.fillStyle = '#FF440080';
          ctx.fillRect(0, y * CELL_SIZE, canvas.width, CELL_SIZE);
        }
      }
    }
    
    // Aktuelles Piece
    if (currentPiece && !gameOver) {
      for (let y = 0; y < currentPiece.shape.length; y++) {
        for (let x = 0; x < currentPiece.shape[y].length; x++) {
          if (currentPiece.shape[y][x] !== 0) {
            const boardX = pieceX + x, boardY = pieceY + y;
            if (boardY >= 0 && boardY < BOARD_HEIGHT && boardX >=0 && boardX < BOARD_WIDTH) {
              ctx.fillStyle = currentPiece.color;
              ctx.fillRect(boardX * CELL_SIZE + 1, boardY * CELL_SIZE + 1, CELL_SIZE - 2, CELL_SIZE - 2);
              ctx.fillStyle = currentPiece.borderColor;
              ctx.fillRect(boardX * CELL_SIZE + 1, boardY * CELL_SIZE + 1, CELL_SIZE - 2, 2);
              ctx.fillRect(boardX * CELL_SIZE + 1, boardY * CELL_SIZE + 1, 2, CELL_SIZE - 2);
            }
          }
        }
      }
    }
    
    // Retro-Scanlines
    ctx.fillStyle = 'rgba(0,0,0,0.05)';
    for (let i = 0; i < canvas.height; i += 2) {
      ctx.fillRect(0, i, canvas.width, 1);
    }
    
    // SCND Wasserzeichen
    ctx.font = 'bold 14px monospace';
    ctx.fillStyle = '#FF440015';
    ctx.fillText('SCND', canvas.width / 2 - 25, canvas.height / 2);
    
    // Popup Score
    if (popupScore) {
      ctx.font = 'bold 24px monospace';
      ctx.fillStyle = '#FF4400';
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#FF4400';
      ctx.fillText(`+${popupScore.score}`, popupScore.x - 20, popupScore.y);
      ctx.shadowBlur = 0;
    }
  }, [board, currentPiece, pieceX, pieceY, gameOver, flashRow, popupScore]);

  const saveHighscore = () => {
    if (playerName.trim() === '') return;
    const newHighscores = [...highscores, { name: playerName, score }];
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
    <div className={`my-12 p-6 bg-[var(--bg-secondary)] rounded-lg border-2 border-[#FF4400]/30 shadow-xl transition-all ${newHighscoreGlow ? 'shadow-[0_0_30px_#FF4400]' : ''}`}>
      <div className="relative">
        <div className="absolute inset-0 pointer-events-none rounded-lg overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-black/20"></div>
        </div>
        
        <div className="text-center mb-4">
          <h3 className="text-3xl font-bold tracking-tighter">
            <span className="text-[#FF4400]">SCND</span>_<span className="text-[var(--text-primary)]">DROP</span>
          </h3>
          <p className="text-xs text-[var(--text-secondary)] uppercase tracking-widest mt-1">BAUHAUS EDITION · 1919-1933</p>
        </div>

        <div className="flex flex-col md:flex-row gap-8 justify-center items-start">
          <div className="relative">
            <canvas ref={canvasRef} className="border-4 border-[#FF4400] shadow-lg shadow-[#FF4400]/20 rounded-sm" />
            {!isPlaying && !gameOver && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm rounded-sm">
                <button onClick={startGame} className="px-8 py-3 bg-[#FF4400] text-white font-bold uppercase tracking-wider rounded-sm hover:bg-[#FF4400]/80 transition-all hover:scale-105 shadow-lg">
                  ▶ START
                </button>
              </div>
            )}
            {gameOver && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm rounded-sm">
                <div className="text-2xl font-bold tracking-tighter mb-2">
                  <span className="text-[#FF4400]">GAME</span>_<span className="text-white">OVER</span>
                </div>
                <button onClick={startGame} className="px-6 py-2 bg-[#FF4400] text-white font-bold uppercase tracking-wider rounded-sm text-sm hover:bg-[#FF4400]/80 transition">NEUSTART</button>
              </div>
            )}
          </div>

          <div className="bg-[var(--bg-primary)] p-5 rounded-lg border border-[#FF4400]/30 min-w-[220px]">
            <div className="text-center mb-4 pb-3 border-b border-[#FF4400]/30">
              <div className="text-xs text-[var(--text-secondary)] uppercase tracking-widest">SCORE</div>
              <div className="text-4xl font-bold text-[#FF4400]">{score}</div>
              <div className="text-xs text-[var(--text-secondary)] mt-1">LINES: {linesCleared}</div>
            </div>
            
            <h4 className="font-bold text-sm uppercase tracking-widest text-[#FF4400] mb-3">🏆 HIGHSCORES</h4>
            <ul className="space-y-2">
              {highscores.map((hs, idx) => (
                <li key={idx} className="flex justify-between items-center border-b border-[var(--border-color)] py-1">
                  <span className="flex items-center gap-2">
                    <span className="text-lg">{rankIcon(idx)}</span>
                    <span className="font-medium">{hs.name}</span>
                  </span>
                  <span className="text-[#FF4400] font-bold">{hs.score}</span>
                </li>
              ))}
              {highscores.length === 0 && (
                <li className="text-center text-[var(--text-secondary)] py-2">— leer —</li>
              )}
            </ul>
            <div className="mt-4 pt-3 border-t border-[#FF4400]/30 text-center">
              <div className="text-[10px] text-[var(--text-secondary)] uppercase tracking-widest">CONTROLS</div>
              <div className="flex justify-center gap-4 mt-2 text-sm">
                <span>← → ↓</span>
                <span className="text-[#FF4400]">↑</span>
                <span className="text-[var(--text-secondary)]">DREHEN</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showNameInput && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-[var(--bg-secondary)] p-6 rounded-lg border-2 border-[#FF4400] max-w-sm w-full mx-4 shadow-2xl">
            <h3 className="text-2xl font-bold tracking-tighter mb-2">
              <span className="text-[#FF4400]">✨ NEW</span>_<span className="text-[var(--text-primary)]">HIGHSCORE</span>
            </h3>
            <p className="text-[var(--text-secondary)] mb-4">Punktzahl: <span className="text-[#FF4400] font-bold text-xl">{score}</span></p>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              maxLength={15}
              className="w-full p-3 bg-[var(--bg-primary)] border-2 border-[#FF4400] rounded mb-4 text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[#FF4400] uppercase tracking-wider"
              placeholder="DEIN SPITZNAME"
              autoFocus
            />
            <div className="flex gap-3">
              <button onClick={saveHighscore} className="flex-1 px-4 py-2 bg-[#FF4400] text-white font-bold uppercase tracking-wider rounded hover:bg-[#FF4400]/80 transition">SPEICHERN</button>
              <button onClick={() => setShowNameInput(false)} className="flex-1 px-4 py-2 border border-gray-500 rounded hover:bg-gray-800 transition">ABBRECHEN</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
