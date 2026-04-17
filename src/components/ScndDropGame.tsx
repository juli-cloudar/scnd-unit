// src/components/ScndDropGame.tsx
'use client';

import { useEffect, useRef, useState } from 'react';

const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;
const CELL_SIZE = 32;

// DEIN FARBSCHEMA + BAUHAUS DESIGN
const TETROMINOS = [
  { 
    shape: [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]], 
    color: '#FF4400',  // SCND Orange
    borderColor: '#CC3300',
    name: 'I'
  },
  { 
    shape: [[0,0,0,0],[0,1,1,0],[0,1,1,0],[0,0,0,0]], 
    color: '#FFD700',  // Bauhaus Gelb
    borderColor: '#CCAA00',
    name: 'O'
  },
  { 
    shape: [[0,0,0,0],[0,1,0,0],[1,1,1,0],[0,0,0,0]], 
    color: '#CC0000',  // Bauhaus Rot
    borderColor: '#990000',
    name: 'T'
  },
  { 
    shape: [[0,0,0,0],[0,1,1,0],[1,1,0,0],[0,0,0,0]], 
    color: '#1A1A1A',  // Bauhaus Schwarz
    borderColor: '#333333',
    name: 'S'
  },
  { 
    shape: [[0,0,0,0],[1,1,0,0],[0,1,1,0],[0,0,0,0]], 
    color: '#F5F5F5',  // Bauhaus Weiß
    borderColor: '#CCCCCC',
    name: 'Z'
  },
  { 
    shape: [[0,0,0,0],[1,0,0,0],[1,1,1,0],[0,0,0,0]], 
    color: '#0055A4',  // Bauhaus Blau
    borderColor: '#004080',
    name: 'L'
  },
  { 
    shape: [[0,0,0,0],[0,0,1,0],[1,1,1,0],[0,0,0,0]], 
    color: '#00A86B',  // Bauhaus Grün
    borderColor: '#008050',
    name: 'J'
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
  const [level, setLevel] = useState(1);
  const [gameOver, setGameOver] = useState(false);
  const [highscores, setHighscores] = useState<Highscore[]>([]);
  const [showNameInput, setShowNameInput] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [linesCleared, setLinesCleared] = useState(0);
  const [flashRow, setFlashRow] = useState<number | null>(null);
  const [popupScore, setPopupScore] = useState<{ score: number; x: number; y: number } | null>(null);
  const [combo, setCombo] = useState(0);
  const [newHighscoreGlow, setNewHighscoreGlow] = useState(false);
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);

  // Geschwindigkeit basierend auf Level
  const getFallDelay = () => Math.max(100, 400 - (level - 1) * 30);

  useEffect(() => {
    const saved = localStorage.getItem('scnd_block_highscores');
    if (saved) setHighscores(JSON.parse(saved));
  }, []);

  const startGame = () => {
    setBoard(Array(BOARD_HEIGHT).fill(null).map(() => Array(BOARD_WIDTH).fill(null)));
    setScore(0);
    setLevel(1);
    setLinesCleared(0);
    setCombo(0);
    setGameOver(false);
    setShowNameInput(false);
    spawnNewPiece();
    setIsPlaying(true);
  };

  const giveUp = () => {
    if (isPlaying && !gameOver) {
      setGameOver(true);
      setIsPlaying(false);
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
      const isHighscore = highscores.length < 3 || score > highscores[2]?.score;
      if (score > 0 && isHighscore) {
        setShowNameInput(true);
        setNewHighscoreGlow(true);
        setTimeout(() => setNewHighscoreGlow(false), 2000);
      }
    }
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
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
      const isHighscore = highscores.length < 3 || score > highscores[2]?.score;
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
    const clearedRows: number[] = [];
    for (let row = BOARD_HEIGHT - 1; row >= 0; ) {
      if (newBoard[row].every(cell => cell !== null)) {
        clearedRows.push(row);
        setFlashRow(row);
        setTimeout(() => setFlashRow(null), 150);
        newBoard.splice(row, 1);
        newBoard.unshift(Array(BOARD_WIDTH).fill(null));
        rowsCleared++;
      } else row--;
    }
    
    // Punkteberechnung mit Combo-Bonus
    const points = [0, 40, 100, 300, 1200];
    let addedScore = points[rowsCleared];
    if (rowsCleared > 0) {
      setCombo(prev => prev + 1);
      addedScore = Math.floor(addedScore * (1 + combo * 0.1));
    } else {
      setCombo(0);
    }
    
    const newScore = score + addedScore;
    setScore(newScore);
    
    // Level basierend auf gelöschten Linien
    const newLines = linesCleared + rowsCleared;
    setLinesCleared(newLines);
    const newLevel = Math.floor(newLines / 10) + 1;
    if (newLevel !== level) {
      setLevel(newLevel);
    }
    
    if (addedScore > 0) {
      setPopupScore({ score: addedScore, x: BOARD_WIDTH * CELL_SIZE / 2, y: BOARD_HEIGHT * CELL_SIZE / 2 - 50 });
      setTimeout(() => setPopupScore(null), 500);
    }
    
    setBoard(newBoard);
    spawnNewPiece();
  };

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

  // Tastatursteuerung mit preventDefault
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
  }, [currentPiece, pieceX, pieceY, board, gameOver]);

  // Game Loop mit dynamischer Geschwindigkeit
  useEffect(() => {
    if (isPlaying && !gameOver) {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
      gameLoopRef.current = setInterval(() => movePiece(0, 1), getFallDelay());
    }
    return () => { if (gameLoopRef.current) clearInterval(gameLoopRef.current); };
  }, [isPlaying, gameOver, currentPiece, pieceX, pieceY, board, level]);

  // Canvas zeichnen
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
    
    // Bauhaus-Gitterlinien (dünn, orange)
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
    
    // Blöcke mit Bauhaus-3D-Effekt
    for (let y = 0; y < BOARD_HEIGHT; y++) {
      for (let x = 0; x < BOARD_WIDTH; x++) {
        const cell = board[y][x];
        if (cell) {
          // Hauptblock
          ctx.fillStyle = cell.color;
          ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE - 1, CELL_SIZE - 1);
          // Heller Rand (oben/links) für 3D-Effekt
          ctx.fillStyle = cell.borderColor;
          ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE - 1, 2);
          ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, 2, CELL_SIZE - 1);
        }
        if (flashRow === y) {
          ctx.fillStyle = '#FF440080';
          ctx.fillRect(0, y * CELL_SIZE, canvas.width, CELL_SIZE);
        }
      }
    }
    
    // Aktuelles Piece mit Vorschau (Ghost)
    if (currentPiece && !gameOver) {
      // Ghost Piece (wo es landen wird)
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
                ctx.fillRect(boardX * CELL_SIZE, boardY * CELL_SIZE, CELL_SIZE - 1, CELL_SIZE - 1);
              }
            }
          }
        }
        ctx.globalAlpha = 1;
      }
      
      // Aktuelles Piece
      for (let y = 0; y < currentPiece.shape.length; y++) {
        for (let x = 0; x < currentPiece.shape[y].length; x++) {
          if (currentPiece.shape[y][x] !== 0) {
            const boardX = pieceX + x, boardY = pieceY + y;
            if (boardY >= 0 && boardY < BOARD_HEIGHT && boardX >=0 && boardX < BOARD_WIDTH) {
              ctx.fillStyle = currentPiece.color;
              ctx.fillRect(boardX * CELL_SIZE, boardY * CELL_SIZE, CELL_SIZE - 1, CELL_SIZE - 1);
              ctx.fillStyle = currentPiece.borderColor;
              ctx.fillRect(boardX * CELL_SIZE, boardY * CELL_SIZE, CELL_SIZE - 1, 2);
              ctx.fillRect(boardX * CELL_SIZE, boardY * CELL_SIZE, 2, CELL_SIZE - 1);
            }
          }
        }
      }
    }
    
    // Bauhaus-Wasserzeichen
    ctx.font = 'bold 14px "Bauhaus", monospace';
    ctx.fillStyle = '#FF440015';
    ctx.fillText('BAUHAUS', canvas.width / 2 - 35, canvas.height / 2);
    
    // Combo-Anzeige
    if (combo > 0) {
      ctx.font = 'bold 16px monospace';
      ctx.fillStyle = '#FF4400';
      ctx.shadowBlur = 8;
      ctx.shadowColor = '#FF4400';
      ctx.fillText(`${combo}x COMBO!`, canvas.width - 80, 40);
      ctx.shadowBlur = 0;
    }
    
    // Popup Score
    if (popupScore) {
      ctx.font = 'bold 24px monospace';
      ctx.fillStyle = '#FF4400';
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#FF4400';
      ctx.fillText(`+${popupScore.score}`, popupScore.x - 20, popupScore.y);
      ctx.shadowBlur = 0;
    }
  }, [board, currentPiece, pieceX, pieceY, gameOver, flashRow, popupScore, combo]);

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
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/70 backdrop-blur-sm rounded-sm">
                <button onClick={startGame} className="px-8 py-3 bg-[#FF4400] text-white font-bold uppercase tracking-wider rounded-sm hover:bg-[#FF4400]/80 transition-all hover:scale-105 shadow-lg">
                  ▶ START
                </button>
              </div>
            )}
            {gameOver && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/70 backdrop-blur-sm rounded-sm">
                <div className="text-2xl font-bold tracking-tighter mb-2">
                  <span className="text-[#FF4400]">GAME</span>_<span className="text-white">OVER</span>
                </div>
                <button onClick={startGame} className="px-6 py-2 bg-[#FF4400] text-white font-bold uppercase tracking-wider rounded-sm text-sm hover:bg-[#FF4400]/80 transition">NEUSTART</button>
                <button onClick={giveUp} className="px-6 py-2 border border-[#FF4400] text-[#FF4400] font-bold uppercase tracking-wider rounded-sm text-sm hover:bg-[#FF4400]/10 transition">AUFGABEN</button>
              </div>
            )}
          </div>

          <div className="bg-[var(--bg-primary)] p-5 rounded-lg border border-[#FF4400]/30 min-w-[220px]">
            <div className="text-center mb-4 pb-3 border-b border-[#FF4400]/30">
              <div className="text-xs text-[var(--text-secondary)] uppercase tracking-widest">SCORE</div>
              <div className="text-4xl font-bold text-[#FF4400]">{score}</div>
              <div className="text-xs text-[var(--text-secondary)] mt-1">LEVEL {level} · LINES {linesCleared}</div>
              {combo > 0 && <div className="text-xs text-[#FF4400] mt-1 animate-pulse">{combo}x COMBO!</div>}
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
              <div className="text-[10px] text-[var(--text-secondary)] mt-1">ESC = AUFGABEN</div>
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
