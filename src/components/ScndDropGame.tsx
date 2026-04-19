'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

// ─── Constants ───────────────────────────────────────────────────────────────
const W = 20;
const H = 20;
type Rot = 0 | 90 | 180 | 270;

// ─── Tetrominos ───────────────────────────────────────────────────────────────
const TETROMINOS = [
  { shape: [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]], color: '#FF8844', border: '#CC5500', name: 'I' },
  { shape: [[0,0,0,0],[0,1,1,0],[0,1,1,0],[0,0,0,0]], color: '#FFDD44', border: '#CCAA00', name: 'O' },
  { shape: [[0,0,0,0],[0,1,0,0],[1,1,1,0],[0,0,0,0]], color: '#FF6666', border: '#CC3333', name: 'T' },
  { shape: [[0,0,0,0],[0,1,1,0],[1,1,0,0],[0,0,0,0]], color: '#AAAAAA', border: '#666666', name: 'S' },
  { shape: [[0,0,0,0],[1,1,0,0],[0,1,1,0],[0,0,0,0]], color: '#EEEEEE', border: '#CCCCCC', name: 'Z' },
  { shape: [[0,0,0,0],[1,0,0,0],[1,1,1,0],[0,0,0,0]], color: '#5588FF', border: '#2255AA', name: 'L' },
  { shape: [[0,0,0,0],[0,0,1,0],[1,1,1,0],[0,0,0,0]], color: '#55DD88', border: '#229955', name: 'J' },
  { shape: [[0,1,0],[1,1,1],[0,1,0]],                  color: '#FF88FF', border: '#AA44AA', name: 'PLUS' },
  { shape: [[1,1,1,1,1]],                               color: '#FF8888', border: '#AA4444', name: '5ER' },
  { shape: [[1,1],[1,1],[1,0]],                         color: '#88AAFF', border: '#4466AA', name: 'EXTRA' },
];

const POWERUP_TETROMINOS = [
  { shape: [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]], color: '#FF4444', border: '#AA0000', name: '💣 BOMBE',       effect: 'bomb',        glow: '#FF6666' },
  { shape: [[0,0,0,0],[0,1,1,0],[0,1,1,0],[0,0,0,0]], color: '#FF44FF', border: '#AA00AA', name: '⚡ LASER',       effect: 'laser',       glow: '#FF88FF' },
  { shape: [[0,0,0,0],[0,1,0,0],[1,1,1,0],[0,0,0,0]], color: '#FFD700', border: '#AA8800', name: '⭐ 3x',          effect: 'scndBonus',   glow: '#FFDD88' },
  { shape: [[0,0,0,0],[0,1,1,0],[1,1,0,0],[0,0,0,0]], color: '#00FFFF', border: '#00AAAA', name: '❄️ FREEZE',      effect: 'freeze',      glow: '#66FFFF' },
  { shape: [[0,0,0,0],[1,0,0,0],[1,1,1,0],[0,0,0,0]], color: '#88FF88', border: '#44AA44', name: '🌀 GRAVITY',     effect: 'gravity',     glow: '#AAFFAA' },
  { shape: [[0,0,0,0],[0,0,1,0],[1,1,1,0],[0,0,0,0]], color: '#FF88AA', border: '#AA4466', name: '🔄 SWAP',        effect: 'swap',        glow: '#FFAACC' },
  { shape: [[0,0,0,0],[1,1,0,0],[0,1,1,0],[0,0,0,0]], color: '#8888FF', border: '#4444AA', name: '🔍 CLEAR',       effect: 'clearLine',   glow: '#AAAADD' },
  { shape: [[1,1],[1,1]],                               color: '#FFDD88', border: '#AA8855', name: '💰 2x SCORE',   effect: 'doubleScore', glow: '#FFEEAA' },
  { shape: [[0,1,0],[1,1,1],[0,1,0]],                  color: '#CCCCFF', border: '#8888AA', name: '🛡️ SHIELD',     effect: 'shield',      glow: '#FFFFFF' },
  { shape: [[1,1,1],[1,1,1],[1,1,1]],                  color: '#FF4444', border: '#AA0000', name: '💥 MEGA BOMBE', effect: 'megaBomb',    glow: '#FF8888' },
  { shape: [[0,1,0],[1,1,1],[0,1,0]],                  color: '#FFAA55', border: '#AA7733', name: '☄️ METEOR',     effect: 'meteor',      glow: '#FFCC88' },
  { shape: [[1,1,1],[1,0,1],[1,1,1]],                  color: '#CCAA88', border: '#997755', name: '⏪ REWIND',      effect: 'rewind',      glow: '#DDCCAA' },
];

// ─── Types ────────────────────────────────────────────────────────────────────
interface Cell {
  color: string;
  border: string;
  isPowerUp?: boolean;
  effect?: string;
  glow?: string;
  isIce?: boolean;
  isPoison?: boolean;
  isGold?: boolean;
  isTeleporter?: boolean;
  iceHit?: boolean;
}

interface Piece {
  shape: number[][];
  color: string;
  border: string;
  name: string;
  isPowerUp?: boolean;
  effect?: string;
  glow?: string;
}

interface Highscore { player_name: string; score: number; }
interface SavedState { board: (Cell|null)[][]; score: number; lines: number; level: number; combo: number; }
interface Particle { x: number; y: number; vx: number; vy: number; life: number; color: string; }

// ─── Helpers ──────────────────────────────────────────────────────────────────
const emptyBoard = (): (Cell|null)[][] =>
  Array.from({ length: H }, () => Array(W).fill(null));

/** Rotate a shape 90° clockwise */
function rotateCW(shape: number[][]): number[][] {
  const rows = shape.length, cols = shape[0].length;
  return Array.from({ length: cols }, (_, c) =>
    Array.from({ length: rows }, (_, r) => shape[rows - 1 - r][c])
  );
}

/**
 * Given the canvas rotation, returns the board-direction that is
 * visually "down". Board coords: +y = down, +x = right.
 *   rot=0   → board-down  = visually down  → dy=+1, dx=0
 *   rot=90  → board-right = visually down  → dx=+1, dy=0
 *   rot=180 → board-up    = visually down  → dy=-1, dx=0
 *   rot=270 → board-left  = visually down  → dx=-1, dy=0
 */
function gravityDir(rot: Rot): { dx: number; dy: number } {
  switch (rot) {
    case 0:   return { dx: 0,  dy: 1  };
    case 90:  return { dx: 1,  dy: 0  };
    case 180: return { dx: 0,  dy: -1 };
    case 270: return { dx: -1, dy: 0  };
  }
}

/** Same mapping for left/right movement on-screen */
function screenToBoard(screenDx: number, screenDy: number, rot: Rot): { dx: number; dy: number } {
  switch (rot) {
    case 0:   return { dx: screenDx,  dy: screenDy  };
    case 90:  return { dx: screenDy,  dy: -screenDx };
    case 180: return { dx: -screenDx, dy: -screenDy };
    case 270: return { dx: -screenDy, dy: screenDx  };
  }
}

/** Flood-fill from all 4 edges; returns a boolean mask of "anchored" cells */
function anchoredMask(board: (Cell|null)[][]): boolean[][] {
  const visited: boolean[][] = Array.from({ length: H }, () => Array(W).fill(false));
  const queue: [number, number][] = [];

  // Seed from all 4 walls
  for (let x = 0; x < W; x++) {
    if (board[0][x])   { visited[0][x]   = true; queue.push([0, x]); }
    if (board[H-1][x]) { visited[H-1][x] = true; queue.push([H-1, x]); }
  }
  for (let y = 0; y < H; y++) {
    if (board[y][0])   { visited[y][0]   = true; queue.push([y, 0]); }
    if (board[y][W-1]) { visited[y][W-1] = true; queue.push([y, W-1]); }
  }

  while (queue.length) {
    const [y, x] = queue.pop()!;
    for (const [ny, nx] of [[y-1,x],[y+1,x],[y,x-1],[y,x+1]]) {
      if (ny >= 0 && ny < H && nx >= 0 && nx < W && !visited[ny][nx] && board[ny][nx]) {
        visited[ny][nx] = true;
        queue.push([ny, nx]);
      }
    }
  }
  return visited;
}

/**
 * Apply one step of rotation-aware gravity to loose (unanchored) blocks.
 * Returns new board + whether anything moved.
 */
function stepGravity(board: (Cell|null)[][], rot: Rot): { board: (Cell|null)[][]; moved: boolean } {
  const anchored = anchoredMask(board);
  const next = board.map(r => [...r]) as (Cell|null)[][];
  let moved = false;
  const { dx, dy } = gravityDir(rot);

  // Iterate in the direction of gravity so we don't overwrite moved blocks
  // For dy=+1 iterate rows bottom-to-top, dx=+1 iterate cols right-to-left, etc.
  const ys = dy === 1 ? Array.from({length:H},(_,i)=>H-1-i)
           : dy === -1 ? Array.from({length:H},(_,i)=>i)
           : Array.from({length:H},(_,i)=>i);
  const xs = dx === 1 ? Array.from({length:W},(_,i)=>W-1-i)
           : dx === -1 ? Array.from({length:W},(_,i)=>i)
           : Array.from({length:W},(_,i)=>i);

  for (const y of ys) {
    for (const x of xs) {
      if (!next[y][x] || anchored[y][x]) continue;
      const ny = y + dy, nx = x + dx;
      if (ny < 0 || ny >= H || nx < 0 || nx >= W) continue;
      if (next[ny][nx]) continue; // blocked
      // Move block
      next[ny][nx] = next[y][x];
      next[y][x] = null;
      moved = true;
    }
  }
  return { board: next, moved };
}

/** Settle all loose blocks to their final position */
function settleBoard(board: (Cell|null)[][], rot: Rot): (Cell|null)[][] {
  let current = board;
  for (let i = 0; i < W + H; i++) {
    const { board: next, moved } = stepGravity(current, rot);
    current = next;
    if (!moved) break;
  }
  return current;
}

/** Check line clears: runs of ≥10 in any axis-aligned direction */
function clearLines(board: (Cell|null)[][], cellSize: number, burst: (x:number,y:number)=>void): { board: (Cell|null)[][]; cleared: number } {
  const toDelete = new Set<number>(); // encoded as y*W+x

  const check = (cells: [number,number][]) => {
    let run: [number,number][] = [];
    for (const [y,x] of [...cells, [-1,-1]]) {
      if (y >= 0 && x >= 0 && board[y][x]) {
        run.push([y,x]);
      } else {
        if (run.length >= 10) run.forEach(([ry,rx]) => toDelete.add(ry*W+rx));
        run = [];
      }
    }
  };

  // Horizontal
  for (let y = 0; y < H; y++) check(Array.from({length:W},(_,x)=>[y,x] as [number,number]));
  // Vertical
  for (let x = 0; x < W; x++) check(Array.from({length:H},(_,y)=>[y,x] as [number,number]));

  if (!toDelete.size) return { board, cleared: 0 };

  const next = board.map(r => [...r]) as (Cell|null)[][];
  let cleared = 0;
  for (const code of toDelete) {
    const y = Math.floor(code / W), x = code % W;
    if (next[y][x]) {
      burst(x * cellSize + cellSize/2, y * cellSize + cellSize/2);
      next[y][x] = null;
      cleared++;
    }
  }
  return { board: next, cleared };
}

function getCellSize(): number {
  if (typeof window === 'undefined') return 24;
  const w = window.innerWidth;
  const max = Math.floor((Math.min(w, 480) - 32) / W);
  return Math.min(Math.max(14, max), 28);
}

// ─── Component ────────────────────────────────────────────────────────────────
export function ScndDropGame() {
  const canvasRef     = useRef<HTMLCanvasElement>(null);
  const containerRef  = useRef<HTMLDivElement>(null);

  // ── mutable game state (no re-render on change) ──
  const boardRef      = useRef<(Cell|null)[][]>(emptyBoard());
  const pieceRef      = useRef<Piece|null>(null);
  const pxRef         = useRef(0);           // piece X in board coords
  const pyRef         = useRef(0);           // piece Y in board coords
  const rotRef        = useRef<Rot>(0);      // current canvas rotation
  const scoreRef      = useRef(0);
  const levelRef      = useRef(1);
  const linesRef      = useRef(0);
  const comboRef      = useRef(0);
  const playingRef    = useRef(false);
  const pausedRef     = useRef(false);
  const gameOverRef   = useRef(false);
  const freezeRef     = useRef(false);
  const slowRef       = useRef(false);
  const fastRef       = useRef(false);
  const shieldRef     = useRef(false);
  const doubleRef     = useRef(false);
  const scndBonusRef  = useRef(false);
  const pulseRef      = useRef(0);
  const particlesRef  = useRef<Particle[]>([]);
  const historyRef    = useRef<SavedState[]>([]);
  const cellSzRef     = useRef(getCellSize());
  const rafRef        = useRef<number>(0);
  const lastFallRef   = useRef(0);
  const gravRafRef    = useRef<number>(0);
  const lastGravRef   = useRef(0);
  const blocksPlaced  = useRef(0);
  const blocksUntilRot= useRef(Math.floor(Math.random()*5)+3);

  // ── react state (UI only) ──
  const [uiScore,    setUiScore]    = useState(0);
  const [uiLevel,    setUiLevel]    = useState(1);
  const [uiLines,    setUiLines]    = useState(0);
  const [uiCombo,    setUiCombo]    = useState(0);
  const [uiPlaying,  setUiPlaying]  = useState(false);
  const [uiPaused,   setUiPaused]   = useState(false);
  const [uiGameOver, setUiGameOver] = useState(false);
  const [uiFinalSc,  setUiFinalSc]  = useState(0);
  const [uiBonus,    setUiBonus]    = useState('');
  const [uiPowerUp,  setUiPowerUp]  = useState('');
  const [uiFlags,    setUiFlags]    = useState({ freeze:false, slow:false, fast:false, shield:false, double:false, scnd:false });
  const [highscores, setHighscores] = useState<Highscore[]>([]);
  const [showName,   setShowName]   = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [isSaving,   setIsSaving]   = useState(false);

  // ── helpers ──
  const updateFlags = useCallback(() => {
    setUiFlags({
      freeze: freezeRef.current,
      slow:   slowRef.current,
      fast:   fastRef.current,
      shield: shieldRef.current,
      double: doubleRef.current,
      scnd:   scndBonusRef.current,
    });
  }, []);

  const showBonus = useCallback((text: string) => {
    setUiBonus(text);
    setTimeout(() => setUiBonus(''), 1800);
  }, []);

  const burstAt = useCallback((bx: number, by: number) => {
    const colors = ['#FF4400','#FF8800','#FFD700','#FF6688','#88FFAA'];
    for (let i = 0; i < 8; i++) {
      particlesRef.current.push({
        x: bx, y: by,
        vx: (Math.random()-0.5)*4,
        vy: (Math.random()-0.5)*4,
        life: 1,
        color: colors[Math.floor(Math.random()*colors.length)],
      });
    }
  }, []);

  // ── collision ──
  const collides = useCallback((shape: number[][], ox: number, oy: number, board?: (Cell|null)[][]): boolean => {
    const b = board ?? boardRef.current;
    for (let y = 0; y < shape.length; y++) {
      for (let x = 0; x < shape[y].length; x++) {
        if (!shape[y][x]) continue;
        const bx = ox+x, by = oy+y;
        if (bx < 0 || bx >= W || by < 0 || by >= H) return true;
        if (b[by][bx]) return true;
      }
    }
    return false;
  }, []);

  // ── ghost position ──
  const getGhost = useCallback((): { x:number; y:number } => {
    const p = pieceRef.current!;
    const rot = rotRef.current;
    const { dx, dy } = gravityDir(rot);
    let gx = pxRef.current, gy = pyRef.current;
    while (!collides(p.shape, gx+dx, gy+dy)) { gx += dx; gy += dy; }
    return { x: gx, y: gy };
  }, [collides]);

  // ── spawn ──
  const spawnPiece = useCallback((): boolean => {
    const isPU = Math.random() < 0.15;
    const pool = isPU ? POWERUP_TETROMINOS : TETROMINOS;
    const src = pool[Math.floor(Math.random()*pool.length)];
    const piece: Piece = {
      shape: src.shape.map(r=>[...r]),
      color: src.color,
      border: (src as any).border,
      name:  src.name,
      isPowerUp: isPU,
      effect:    (src as any).effect,
      glow:      (src as any).glow,
    };

    const pw = piece.shape[0].length;
    const ph = piece.shape.length;
    const cx = Math.floor((W - pw) / 2);
    const cy = Math.floor((H - ph) / 2);

    for (let dy2 = -3; dy2 <= 3; dy2++) {
      for (let dx2 = -3; dx2 <= 3; dx2++) {
        const tx = cx+dx2, ty = cy+dy2;
        if (tx >= 0 && tx+pw <= W && ty >= 0 && ty+ph <= H && !collides(piece.shape, tx, ty)) {
          pieceRef.current = piece;
          pxRef.current = tx;
          pyRef.current = ty;
          return true;
        }
      }
    }
    return false; // board full → game over
  }, [collides]);

  // ── merge piece into board ──
  const mergePiece = useCallback(() => {
    const p = pieceRef.current;
    if (!p) return;

    // Save state for rewind
    historyRef.current = [
      ...historyRef.current.slice(-4),
      {
        board: boardRef.current.map(r=>[...r]),
        score: scoreRef.current,
        lines: linesRef.current,
        level: levelRef.current,
        combo: comboRef.current,
      }
    ];

    // Place blocks
    let newBoard = boardRef.current.map(r=>[...r]) as (Cell|null)[][];
    const powerUps: { x:number; y:number; effect:string }[] = [];

    for (let y = 0; y < p.shape.length; y++) {
      for (let x = 0; x < p.shape[y].length; x++) {
        if (!p.shape[y][x]) continue;
        const bx = pxRef.current+x, by = pyRef.current+y;
        if (bx < 0 || bx >= W || by < 0 || by >= H) continue;
        const cell: Cell = {
          color: p.color,
          border: p.border,
          isPowerUp: p.isPowerUp,
          effect: p.effect,
          glow: p.glow,
          isIce:       !p.isPowerUp && Math.random() < 0.05,
          isPoison:    !p.isPowerUp && Math.random() < 0.03,
          isGold:      !p.isPowerUp && Math.random() < 0.04,
          isTeleporter:!p.isPowerUp && Math.random() < 0.02,
        };
        newBoard[by][bx] = cell;
        if (p.isPowerUp && p.effect) powerUps.push({ x:bx, y:by, effect:p.effect });
      }
    }

    // Clear lines
    const cs = cellSzRef.current;
    const { board: afterClear, cleared } = clearLines(newBoard, cs, burstAt);
    newBoard = afterClear;

    // Settle loose blocks
    newBoard = settleBoard(newBoard, rotRef.current);

    boardRef.current = newBoard;

    // Score
    let added = 0;
    if (cleared > 0) {
      const base = [0,400,1000,3000,12000];
      comboRef.current += 1;
      let mult = 1 + comboRef.current * 0.3;
      if (scndBonusRef.current) mult *= 3;
      if (doubleRef.current) mult *= 2;
      added = Math.floor((base[Math.min(cleared,4)] * mult));
    } else {
      comboRef.current = 0;
    }
    scoreRef.current += added;
    linesRef.current += cleared;
    levelRef.current  = Math.floor(linesRef.current / 8) + 1;

    setUiScore(scoreRef.current);
    setUiLines(linesRef.current);
    setUiLevel(levelRef.current);
    setUiCombo(comboRef.current);

    // Power-up effects
    for (const pu of powerUps) triggerPowerUp(pu.effect, pu.x, pu.y);

    // Rotation trigger
    blocksPlaced.current++;
    if (blocksPlaced.current >= blocksUntilRot.current) {
      blocksPlaced.current = 0;
      blocksUntilRot.current = Math.floor(Math.random()*5)+3;
      doRotate();
    }

    // Spawn next
    if (!spawnPiece()) endGame();
  }, [burstAt, spawnPiece, showBonus]);

  // ── movement ──
  const movePiece = useCallback((screenDx: number, screenDy: number) => {
    const p = pieceRef.current;
    if (!p || !playingRef.current || pausedRef.current || gameOverRef.current || freezeRef.current) return;

    const { dx, dy } = screenToBoard(screenDx, screenDy, rotRef.current);
    const nx = pxRef.current + dx;
    const ny = pyRef.current + dy;

    if (!collides(p.shape, nx, ny)) {
      pxRef.current = nx;
      pyRef.current = ny;
    } else if (screenDy === 1) {
      // Tried to go visually down but collided → merge
      mergePiece();
    }
  }, [collides, mergePiece]);

  const rotatePieceShape = useCallback(() => {
    const p = pieceRef.current;
    if (!p || !playingRef.current || pausedRef.current || gameOverRef.current || freezeRef.current) return;
    const rotated = rotateCW(p.shape);
    if (!collides(rotated, pxRef.current, pyRef.current)) {
      pieceRef.current = { ...p, shape: rotated };
    }
  }, [collides]);

  // ── canvas rotation ──
  const doRotate = useCallback(() => {
    const rots: Rot[] = [0, 90, 180, 270];
    let next = rots[Math.floor(Math.random()*4)] as Rot;
    while (next === rotRef.current) next = rots[Math.floor(Math.random()*4)] as Rot;
    rotRef.current = next;
    if (canvasRef.current) {
      canvasRef.current.style.transform = `rotate(${next}deg)`;
      canvasRef.current.style.transition = 'transform 0.4s cubic-bezier(0.2,0.9,0.4,1.1)';
    }
    if (typeof window !== 'undefined' && window.navigator.vibrate) window.navigator.vibrate(80);
  }, []);

  // ── power-ups ──
  const triggerPowerUp = useCallback((effect: string, px: number, py: number) => {
    setUiPowerUp(effect.toUpperCase());
    showBonus(`✨ ${effect.toUpperCase()} AKTIVIERT!`);
    for (let i = 0; i < 20; i++) burstAt(px*cellSzRef.current+cellSzRef.current/2, py*cellSzRef.current+cellSzRef.current/2);

    const b = boardRef.current.map(r=>[...r]) as (Cell|null)[][];

    switch (effect) {
      case 'bomb':
        for (let dy=-2;dy<=2;dy++) for (let dx=-2;dx<=2;dx++) {
          const nx=px+dx, ny=py+dy;
          if (nx>=0&&nx<W&&ny>=0&&ny<H&&b[ny][nx]) { burstAt(nx*cellSzRef.current,ny*cellSzRef.current); b[ny][nx]=null; }
        }
        boardRef.current = settleBoard(b, rotRef.current);
        break;
      case 'laser':
        for (let x=0;x<W;x++) if (b[py][x]) { burstAt(x*cellSzRef.current,py*cellSzRef.current); b[py][x]=null; }
        boardRef.current = settleBoard(b, rotRef.current);
        break;
      case 'scndBonus':
        scndBonusRef.current = true;
        updateFlags();
        setTimeout(()=>{ scndBonusRef.current=false; updateFlags(); }, 30000);
        break;
      case 'freeze':
        freezeRef.current = true;
        updateFlags();
        setTimeout(()=>{ freezeRef.current=false; updateFlags(); }, 3000);
        break;
      case 'gravity':
        boardRef.current = settleBoard(b, rotRef.current);
        break;
      case 'swap': {
        const blocks: {y:number;x:number}[] = [];
        for (let y=0;y<H;y++) for (let x=0;x<W;x++) if (b[y][x]) blocks.push({y,x});
        if (blocks.length >= 2) {
          const ai=Math.floor(Math.random()*blocks.length);
          let bi=Math.floor(Math.random()*blocks.length); while(bi===ai) bi=Math.floor(Math.random()*blocks.length);
          const a=blocks[ai], bk=blocks[bi];
          [b[a.y][a.x], b[bk.y][bk.x]] = [b[bk.y][bk.x], b[a.y][a.x]];
          boardRef.current = b;
        }
        break;
      }
      case 'clearLine': {
        const row=Math.floor(Math.random()*H);
        for (let x=0;x<W;x++) if (b[row][x]) { burstAt(x*cellSzRef.current,row*cellSzRef.current); b[row][x]=null; }
        boardRef.current = settleBoard(b, rotRef.current);
        break;
      }
      case 'doubleScore':
        doubleRef.current = true;
        updateFlags();
        setTimeout(()=>{ doubleRef.current=false; updateFlags(); }, 10000);
        break;
      case 'shield':
        shieldRef.current = true;
        updateFlags();
        setTimeout(()=>{ shieldRef.current=false; updateFlags(); }, 10000);
        break;
      case 'megaBomb':
        for (let dy=-3;dy<=3;dy++) for (let dx2=-3;dx2<=3;dx2++) {
          const nx=px+dx2, ny=py+dy;
          if (nx>=0&&nx<W&&ny>=0&&ny<H&&b[ny][nx]) { burstAt(nx*cellSzRef.current,ny*cellSzRef.current); b[ny][nx]=null; }
        }
        boardRef.current = settleBoard(b, rotRef.current);
        break;
      case 'meteor': {
        const col=Math.floor(Math.random()*W);
        for (let y=0;y<H;y++) if (b[y][col]) { burstAt(col*cellSzRef.current,y*cellSzRef.current); b[y][col]=null; }
        boardRef.current = settleBoard(b, rotRef.current);
        break;
      }
      case 'rewind':
        if (historyRef.current.length > 0) {
          const st = historyRef.current.pop()!;
          boardRef.current    = st.board;
          scoreRef.current    = st.score;
          linesRef.current    = st.lines;
          levelRef.current    = st.level;
          comboRef.current    = st.combo;
          setUiScore(st.score);
          setUiLines(st.lines);
          setUiLevel(st.level);
          setUiCombo(st.combo);
          showBonus('⏪ ZEITREISE!');
        } else {
          showBonus('⏪ KEINE HISTORY!');
        }
        break;
      default: break;
    }
    setTimeout(() => setUiPowerUp(''), 2000);
  }, [burstAt, showBonus, updateFlags]);

  // ── end game ──
  const endGame = useCallback(() => {
    playingRef.current  = false;
    gameOverRef.current = true;
    cancelAnimationFrame(rafRef.current);
    cancelAnimationFrame(gravRafRef.current);
    setUiPlaying(false);
    setUiGameOver(true);
    setUiFinalSc(scoreRef.current);
    const isHS = highscores.length < 3 || scoreRef.current > (highscores[2]?.score ?? 0);
    if (scoreRef.current > 0 && isHS) setShowName(true);
  }, [highscores]);

  // ── fall speed ──
  const getFallMs = useCallback((): number => {
    if (freezeRef.current) return Infinity;
    let ms = Math.max(120, 800 - (levelRef.current - 1) * 50);
    if (slowRef.current)  ms *= 2;
    if (fastRef.current)  ms /= 2;
    return ms;
  }, []);

  // ── MAIN GAME LOOP (rAF, no stale closures) ──────────────────────────────
  const gameLoop = useCallback((now: number) => {
    if (!playingRef.current || gameOverRef.current || pausedRef.current) return;

    pulseRef.current = now * 0.008;

    // Fall tick
    const delay = getFallMs();
    if (delay !== Infinity && now - lastFallRef.current >= delay) {
      movePiece(0, 1);
      lastFallRef.current = now;
    }

    draw();

    rafRef.current = requestAnimationFrame(gameLoop);
  }, [getFallMs, movePiece]);

  // ── GRAVITY LOOP for settled blocks (rAF, every ~120ms) ─────────────────
  const gravLoop = useCallback((now: number) => {
    if (!playingRef.current || gameOverRef.current || pausedRef.current || freezeRef.current) {
      gravRafRef.current = requestAnimationFrame(gravLoop);
      return;
    }

    if (now - lastGravRef.current >= 120) {
      const { board: next, moved } = stepGravity(boardRef.current, rotRef.current);
      if (moved) {
        boardRef.current = next;
        // After gravity, clear any new lines
        const { board: afterClear, cleared } = clearLines(next, cellSzRef.current, burstAt);
        if (cleared > 0) {
          boardRef.current = settleBoard(afterClear, rotRef.current);
          scoreRef.current += cleared * 50; // small bonus for gravity-clears
          setUiScore(scoreRef.current);
        }
      }
      lastGravRef.current = now;
    }

    gravRafRef.current = requestAnimationFrame(gravLoop);
  }, [burstAt]);

  // ── DRAW ─────────────────────────────────────────────────────────────────
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const cs = cellSzRef.current;

    canvas.width  = W * cs;
    canvas.height = H * cs;

    // Background
    ctx.fillStyle = '#0A0A0A';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Grid
    ctx.strokeStyle = '#FF440018';
    ctx.lineWidth = 1;
    for (let x = 0; x <= W; x++) { ctx.beginPath(); ctx.moveTo(x*cs,0); ctx.lineTo(x*cs,canvas.height); ctx.stroke(); }
    for (let y = 0; y <= H; y++) { ctx.beginPath(); ctx.moveTo(0,y*cs); ctx.lineTo(canvas.width,y*cs); ctx.stroke(); }

    // Border
    ctx.strokeStyle = '#FF4400';
    ctx.lineWidth = 3;
    ctx.strokeRect(1,1,canvas.width-2,canvas.height-2);

    // Board cells
    const board = boardRef.current;
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const cell = board[y][x];
        if (!cell) continue;
        if (cell.isPowerUp) { ctx.shadowBlur=14; ctx.shadowColor=cell.glow??'#FFF'; }
        ctx.fillStyle = cell.color;
        ctx.fillRect(x*cs, y*cs, cs-1, cs-1);
        ctx.fillStyle = cell.border;
        ctx.fillRect(x*cs, y*cs, cs-1, 2);
        ctx.fillRect(x*cs, y*cs, 2, cs-1);
        ctx.shadowBlur = 0;
        // Icons
        const icon = cell.isPowerUp ? '✨' : cell.isIce ? '❄️' : cell.isPoison ? '☠️' : cell.isGold ? '💰' : cell.isTeleporter ? '🌀' : null;
        if (icon && cs >= 16) {
          ctx.font = `${Math.max(8,cs*0.38)}px monospace`;
          ctx.fillText(icon, x*cs+cs*0.55, y*cs+cs*0.82);
        }
      }
    }

    // Ghost piece
    const p = pieceRef.current;
    if (p && !gameOverRef.current && !freezeRef.current && !pausedRef.current) {
      const g = getGhost();
      ctx.globalAlpha = 0.22;
      for (let y = 0; y < p.shape.length; y++) {
        for (let x = 0; x < p.shape[y].length; x++) {
          if (!p.shape[y][x]) continue;
          const bx = g.x+x, by = g.y+y;
          if (bx>=0&&bx<W&&by>=0&&by<H) {
            ctx.fillStyle = p.color;
            ctx.fillRect(bx*cs, by*cs, cs-1, cs-1);
          }
        }
      }
      ctx.globalAlpha = 1;

      // Active piece
      const glow = 8 + 5 * Math.sin(pulseRef.current);
      ctx.shadowBlur    = glow;
      ctx.shadowColor   = p.glow ?? '#FFFFFF';
      ctx.shadowOffsetY = 3;
      for (let y = 0; y < p.shape.length; y++) {
        for (let x = 0; x < p.shape[y].length; x++) {
          if (!p.shape[y][x]) continue;
          const bx = pxRef.current+x, by = pyRef.current+y;
          if (bx>=0&&bx<W&&by>=0&&by<H) {
            ctx.fillStyle = p.color;
            ctx.fillRect(bx*cs, by*cs, cs-1, cs-1);
            ctx.fillStyle = p.border;
            ctx.fillRect(bx*cs, by*cs, cs-1, 2);
            ctx.fillRect(bx*cs, by*cs, 2, cs-1);
            if (p.isPowerUp && cs >= 16) {
              ctx.font = `${Math.max(8,cs*0.38)}px monospace`;
              ctx.fillStyle = '#FFF';
              ctx.fillText('✨', bx*cs+cs*0.55, by*cs+cs*0.82);
            }
          }
        }
      }
      ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
    }

    // Particles
    particlesRef.current = particlesRef.current.filter(pt=>pt.life>0);
    for (const pt of particlesRef.current) {
      ctx.globalAlpha = pt.life;
      ctx.fillStyle = pt.color;
      ctx.fillRect(pt.x-2,pt.y-2,4,4);
      pt.x += pt.vx; pt.y += pt.vy; pt.life -= 0.04;
    }
    ctx.globalAlpha = 1;

    // Level progress bar
    const progress = ((linesRef.current % 8) / 8) * canvas.width;
    ctx.fillStyle = '#222';
    ctx.fillRect(0, canvas.height-4, canvas.width, 4);
    ctx.fillStyle = '#FF4400';
    ctx.fillRect(0, canvas.height-4, progress, 4);
  }, [getGhost]);

  // ── start / restart ──────────────────────────────────────────────────────
  const startGame = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    cancelAnimationFrame(gravRafRef.current);

    boardRef.current    = emptyBoard();
    scoreRef.current    = 0;
    levelRef.current    = 1;
    linesRef.current    = 0;
    comboRef.current    = 0;
    pieceRef.current    = null;
    freezeRef.current   = false;
    slowRef.current     = false;
    fastRef.current     = false;
    shieldRef.current   = false;
    doubleRef.current   = false;
    scndBonusRef.current= false;
    particlesRef.current= [];
    historyRef.current  = [];
    blocksPlaced.current= 0;
    blocksUntilRot.current = Math.floor(Math.random()*5)+3;
    gameOverRef.current = false;
    pausedRef.current   = false;
    playingRef.current  = true;

    const rots: Rot[] = [0,90,180,270];
    rotRef.current = rots[Math.floor(Math.random()*4)];
    if (canvasRef.current) canvasRef.current.style.transform = `rotate(${rotRef.current}deg)`;

    setUiScore(0); setUiLevel(1); setUiLines(0); setUiCombo(0);
    setUiGameOver(false); setUiPaused(false); setUiPowerUp('');
    setUiBonus(''); setShowName(false);
    updateFlags();

    spawnPiece();
    setUiPlaying(true);

    const now = performance.now();
    lastFallRef.current = now;
    lastGravRef.current = now;
    rafRef.current     = requestAnimationFrame(gameLoop);
    gravRafRef.current = requestAnimationFrame(gravLoop);
  }, [spawnPiece, gameLoop, gravLoop, updateFlags]);

  const togglePause = useCallback(() => {
    if (!playingRef.current || gameOverRef.current) return;
    pausedRef.current = !pausedRef.current;
    setUiPaused(pausedRef.current);
    if (!pausedRef.current) {
      const now = performance.now();
      lastFallRef.current = now;
      lastGravRef.current = now;
      rafRef.current     = requestAnimationFrame(gameLoop);
      gravRafRef.current = requestAnimationFrame(gravLoop);
    } else {
      cancelAnimationFrame(rafRef.current);
      draw();
    }
  }, [gameLoop, gravLoop, draw]);

  const giveUp = useCallback(() => {
    if (!playingRef.current || gameOverRef.current) return;
    endGame();
  }, [endGame]);

  // ── keyboard ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!playingRef.current) return;
      switch (e.key) {
        case 'ArrowLeft':  e.preventDefault(); movePiece(-1, 0); break;
        case 'ArrowRight': e.preventDefault(); movePiece( 1, 0); break;
        case 'ArrowDown':  e.preventDefault(); movePiece( 0, 1); break;
        case 'ArrowUp':    e.preventDefault(); rotatePieceShape(); break;
        case 'Escape':     e.preventDefault(); togglePause(); break;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [movePiece, rotatePieceShape, togglePause]);

  // ── cell size on resize ──
  useEffect(() => {
    const onResize = () => { cellSzRef.current = getCellSize(); };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // ── highscores ──
  useEffect(() => {
    fetch('/api/game-highscores')
      .then(r=>r.json())
      .then(d=>{ if(Array.isArray(d)) setHighscores(d); })
      .catch(()=>{});
  }, []);

  const saveHighscore = async () => {
    if (!playerName.trim() || isSaving) return;
    setIsSaving(true);
    try {
      await fetch('/api/game-highscores', {
        method: 'POST',
        headers: { 'Content-Type':'application/json' },
        body: JSON.stringify({ playerName, score: uiFinalSc }),
      });
      const r = await fetch('/api/game-highscores');
      const d = await r.json();
      if (Array.isArray(d)) setHighscores(d);
    } catch { alert('Highscore konnte nicht gespeichert werden.'); }
    finally { setIsSaving(false); setShowName(false); setPlayerName(''); }
  };

  const rankIcon = (i:number) => ['🥇','🥈','🥉'][i] ?? '';

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen md:min-h-0 md:my-6 bg-gradient-to-br from-[#0A0A0A] to-[#111] rounded-2xl border-2 border-[#FF4400]/40 shadow-2xl flex flex-col overflow-hidden">
      {/* Top accent */}
      <div className="h-1 bg-gradient-to-r from-[#FF4400] via-[#FFD700] to-[#FF4400]" />

      {/* Header */}
      <div className="pt-2 pb-1 px-3 text-center">
        <h3 className="text-2xl md:text-3xl font-black tracking-tighter bg-gradient-to-r from-[#FF4400] to-[#FF8800] bg-clip-text text-transparent">
          SCND DROP
        </h3>

        {/* Active flags */}
        <div className="flex justify-center gap-1 mt-1 flex-wrap">
          {uiFlags.freeze && <span className="px-1.5 py-0.5 bg-cyan-500/20 text-cyan-300 text-[9px] rounded-full animate-pulse">❄️ FREEZE</span>}
          {uiFlags.slow   && <span className="px-1.5 py-0.5 bg-teal-500/20   text-teal-300   text-[9px] rounded-full">🐢 SLOW</span>}
          {uiFlags.fast   && <span className="px-1.5 py-0.5 bg-orange-500/20 text-orange-300 text-[9px] rounded-full animate-pulse">⏩ FAST</span>}
          {uiFlags.shield && <span className="px-1.5 py-0.5 bg-indigo-500/20 text-indigo-300 text-[9px] rounded-full animate-pulse">🛡️ SHIELD</span>}
          {uiFlags.double && <span className="px-1.5 py-0.5 bg-yellow-500/20 text-yellow-300 text-[9px] rounded-full animate-pulse">💰 2×</span>}
          {uiFlags.scnd   && <span className="px-1.5 py-0.5 bg-amber-500/20  text-amber-300  text-[9px] rounded-full animate-pulse">⭐ 3×</span>}
          {uiPowerUp      && <span className="px-1.5 py-0.5 bg-green-500/20  text-green-300  text-[9px] rounded-full animate-pulse">✨ {uiPowerUp}</span>}
        </div>

        {uiBonus && (
          <div className="mt-1 animate-bounce">
            <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-300 text-[10px] rounded-full border border-yellow-500/30">
              {uiBonus}
            </span>
          </div>
        )}
      </div>

      {/* Main area */}
      <div ref={containerRef} className="flex-1 flex flex-col md:flex-row gap-3 md:gap-4 justify-center items-center md:items-start px-3 py-2">

        {/* Canvas */}
        <div className="relative flex justify-center items-center">
          <div className="absolute -inset-2 bg-gradient-to-r from-[#FF4400]/20 to-[#FF8800]/20 rounded-xl blur-xl opacity-60 pointer-events-none" />
          <canvas
            ref={canvasRef}
            style={{
              display: 'block',
              width:  `${W * getCellSize()}px`,
              height: `${H * getCellSize()}px`,
              transform: `rotate(${rotRef.current}deg)`,
              transition: 'transform 0.4s cubic-bezier(0.2,0.9,0.4,1.1)',
              borderRadius: '6px',
            }}
          />

          {/* Overlays */}
          {uiPaused && !uiGameOver && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/85 backdrop-blur-md rounded-lg z-40">
              <div className="text-xl font-black text-[#FF4400] mb-3 tracking-tighter">PAUSE</div>
              <button onClick={()=>togglePause()} className="w-32 py-1.5 mb-2 bg-gradient-to-r from-[#FF4400] to-[#FF6600] text-white font-bold uppercase rounded-lg text-xs hover:scale-105 transition-all">▶ WEITER</button>
              <button onClick={startGame}          className="w-32 py-1.5 mb-2 border border-[#FF4400] text-[#FF4400] font-bold uppercase rounded-lg text-xs hover:bg-[#FF4400]/10 transition-all">🔄 NEUSTART</button>
              <button onClick={giveUp}             className="w-32 py-1.5 border border-red-500 text-red-400 font-bold uppercase rounded-lg text-xs hover:bg-red-500/10 transition-all">⚡ AUFGEBEN</button>
            </div>
          )}

          {!uiPlaying && !uiGameOver && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm rounded-lg">
              <div className="text-xl font-black text-[#FF4400] mb-3 tracking-tighter">SCND DROP</div>
              <button onClick={startGame} className="px-5 py-2 bg-gradient-to-r from-[#FF4400] to-[#FF6600] text-white font-black uppercase tracking-wider rounded-lg text-sm hover:scale-105 transition-all shadow-lg shadow-[#FF4400]/30">
                ▶ START
              </button>
            </div>
          )}

          {uiGameOver && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/85 backdrop-blur-sm rounded-lg">
              <div className="text-lg font-black mb-1"><span className="text-[#FF4400]">GAME</span> <span className="text-white">OVER</span></div>
              <div className="text-2xl font-black text-[#FF4400] mb-3">{uiFinalSc.toLocaleString()}</div>
              <button onClick={startGame} className="px-4 py-1.5 bg-gradient-to-r from-[#FF4400] to-[#FF6600] text-white font-bold uppercase rounded-lg text-xs hover:scale-105 transition-all">
                NEUSTART
              </button>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="bg-black/60 rounded-xl border border-[#FF4400]/30 p-3 min-w-[160px] shadow-xl">
          {/* Score */}
          <div className="text-center mb-3 pb-3 border-b border-[#FF4400]/20">
            <div className="text-[8px] text-gray-500 uppercase tracking-widest mb-0.5">PUNKTE</div>
            <div className="text-3xl font-black text-[#FF4400] tabular-nums drop-shadow-[0_0_8px_rgba(255,68,0,0.6)]">
              {(uiGameOver ? uiFinalSc : uiScore).toLocaleString()}
            </div>
            <div className="flex justify-center gap-4 mt-1.5">
              {[['LVL',uiLevel],['LINES',uiLines],['COMBO',`${uiCombo}×`]].map(([l,v])=>(
                <div key={l as string} className="text-center">
                  <div className="text-[7px] text-gray-600 uppercase">{l}</div>
                  <div className="text-[11px] font-bold text-[#FF8800]">{v}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Highscores */}
          <div className="mb-3">
            <div className="text-[8px] text-[#FF4400] uppercase tracking-widest font-bold mb-1.5">🏆 TOP 3</div>
            {highscores.length === 0 ? (
              <div className="text-[9px] text-gray-600 italic text-center py-1">— keine —</div>
            ) : highscores.map((hs,i)=>(
              <div key={i} className="flex justify-between items-center bg-black/40 rounded px-2 py-1 mb-0.5">
                <span className="text-[9px]">{rankIcon(i)} <span className="text-gray-300 truncate max-w-[55px] inline-block align-bottom">{hs.player_name}</span></span>
                <span className="text-[9px] text-[#FF4400] font-bold tabular-nums">{hs.score.toLocaleString()}</span>
              </div>
            ))}
          </div>

          {/* Controls */}
          <div className="pt-2 border-t border-[#FF4400]/20">
            <div className="text-[7px] text-gray-600 uppercase tracking-widest mb-1 text-center">STEUERUNG</div>
            {[['←→','Bewegen'],['↓','Fallen'],['↑','Drehen'],['ESC','Pause']].map(([k,v])=>(
              <div key={k} className="flex justify-between items-center mb-0.5">
                <kbd className="px-1.5 py-0.5 bg-black/50 border border-[#FF4400]/40 rounded text-[8px] font-mono text-[#FF4400]">{k}</kbd>
                <span className="text-[8px] text-gray-500">{v}</span>
              </div>
            ))}
          </div>

          {/* Give up */}
          {uiPlaying && !uiGameOver && (
            <button onClick={giveUp} className="w-full mt-3 py-1 border border-red-800 text-red-600 text-[9px] font-bold uppercase rounded hover:bg-red-900/20 transition-all">
              AUFGEBEN
            </button>
          )}
        </div>
      </div>

      {/* Mobile controls */}
      {uiPlaying && !uiGameOver && !uiPaused && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-black/95 border-t border-[#FF4400]/30 py-3 z-50">
          <div className="flex justify-between items-center px-6 max-w-sm mx-auto">
            <div className="flex gap-4">
              {[['◀',()=>movePiece(-1,0)],['▼',()=>movePiece(0,1)],['▶',()=>movePiece(1,0)]].map(([lbl,fn])=>(
                <button key={lbl as string}
                  onTouchStart={e=>{e.preventDefault();(fn as ()=>void)();}}
                  className="w-14 h-14 bg-black border-2 border-[#FF4400] rounded-full flex items-center justify-center text-white text-xl font-bold active:scale-90 transition-all"
                  style={{touchAction:'none',userSelect:'none'}}>
                  {lbl}
                </button>
              ))}
            </div>
            <div className="flex gap-4">
              <button
                onTouchStart={e=>{e.preventDefault();rotatePieceShape();}}
                className="w-14 h-14 bg-gradient-to-br from-[#FF4400] to-[#CC3300] border-2 border-white/20 rounded-full flex items-center justify-center text-white text-sm font-black active:scale-90 transition-all"
                style={{touchAction:'none',userSelect:'none'}}>
                ROT
              </button>
              <button
                onTouchStart={e=>{e.preventDefault();togglePause();}}
                className="w-14 h-14 bg-black border-2 border-[#FF4400]/60 rounded-full flex items-center justify-center text-white text-xl active:scale-90 transition-all"
                style={{touchAction:'none',userSelect:'none'}}>
                ⏸
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="md:hidden h-24" />

      {/* Name input modal */}
      {showName && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#111] p-6 rounded-xl border-2 border-[#FF4400] max-w-sm w-full shadow-2xl">
            <h3 className="text-xl font-black text-[#FF4400] mb-1">✨ HIGHSCORE!</h3>
            <p className="text-sm text-gray-400 mb-4">Punktzahl: <span className="text-[#FF4400] font-black text-lg">{uiFinalSc.toLocaleString()}</span></p>
            <input
              type="text" value={playerName}
              onChange={e=>setPlayerName(e.target.value)}
              onKeyDown={e=>e.key==='Enter'&&saveHighscore()}
              maxLength={15}
              className="w-full p-3 bg-black border-2 border-[#FF4400] rounded-lg mb-4 text-white text-sm uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-[#FF4400]"
              placeholder="DEIN NAME" autoFocus
            />
            <div className="flex gap-3">
              <button onClick={saveHighscore} disabled={isSaving} className="flex-1 py-2 bg-[#FF4400] text-white font-bold uppercase rounded-lg text-sm hover:bg-[#FF6600] transition disabled:opacity-50">
                {isSaving ? '…' : 'SPEICHERN'}
              </button>
              <button onClick={()=>setShowName(false)} className="flex-1 py-2 border border-gray-600 text-gray-400 font-bold uppercase rounded-lg text-sm hover:bg-gray-800 transition">
                SKIP
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
