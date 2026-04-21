'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

// ─── Brand ────────────────────────────────────────────────────────────────────
const BRAND = '#FF4400';
const BRAND_DIM = '#CC3300';

type Rot = 0 | 90 | 180 | 270;

// ─── Board dimensions ─────────────────────────────────────────────────────────
// Fixed 15×15 for all screen sizes – better overview, larger playfield per pixel.
// Mobile gets the same grid but with smaller 3-cell pieces.
function getBoardDims(_isMobile: boolean) {
  return { W: 15, H: 15 };
}

// ─── Theme ────────────────────────────────────────────────────────────────────
function getTheme(isDark: boolean) {
  return {
    canvasBg:      isDark ? '#1A1714' : '#F5F0EB',
    gridLine:      isDark ? 'rgba(255,68,0,0.07)' : 'rgba(255,68,0,0.12)',
    panelBg:       isDark ? '#1E1C1A' : '#FFFFFF',
    panelBorder:   isDark ? '#2E2A26' : '#E0D8D0',
    textPrimary:   isDark ? '#E5DDD5' : '#252422',
    textMuted:     isDark ? '#7A6F66' : '#8A7E74',
    overlayBg:     isDark ? 'rgba(26,23,20,0.93)' : 'rgba(238,233,226,0.95)',
    wrapperBg:     isDark ? '#141210' : '#EDE8E2',
    progressTrack: isDark ? '#2E2A26' : '#D8D0C8',
  };
}

// ─── Block palette ────────────────────────────────────────────────────────────
const BLOCK_COLORS = [
  { color:'#FFDC71', border:'#C8A800' },
  { color:'#B7D354', border:'#7A9A20' },
  { color:'#76C662', border:'#3E8A30' },
  { color:'#4D8A70', border:'#1E5040' },
  { color:'#538BB9', border:'#245A88' },
  { color:'#58D1C6', border:'#1A8A80' },
  { color:'#55629B', border:'#1E3060' },
  { color:'#56425B', border:'#2A1A30' },
  { color:'#814566', border:'#481A38' },
  { color:'#9B70B8', border:'#5A2880' },
  { color:'#C45B63', border:'#7A2030' },
  { color:'#EA8E77', border:'#A84830' },
  { color:'#C24B6E', border:'#7A1A3C' },
  { color:'#355D68', border:'#102830' },
  { color:'#7FBAA4', border:'#3A7060' },
  { color:'#EC9A6D', border:'#A85030' },
  { color:'#D9626B', border:'#8A2030' },
  { color:'#FFC27A', border:'#B07020' },
  { color:'#FFEB99', border:'#C8A800' },
  { color:'#A73169', border:'#601040' },
];
const bc = (i: number) => BLOCK_COLORS[i % BLOCK_COLORS.length];

// ─── Tetrominos (desktop 4-wide shapes) ──────────────────────────────────────
const TETROMINOS_DESKTOP = [
  { shape:[[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]], ...bc(0),  name:'I'    },
  { shape:[[0,0,0,0],[0,1,1,0],[0,1,1,0],[0,0,0,0]], ...bc(1),  name:'O'    },
  { shape:[[0,0,0,0],[0,1,0,0],[1,1,1,0],[0,0,0,0]], ...bc(2),  name:'T'    },
  { shape:[[0,0,0,0],[0,1,1,0],[1,1,0,0],[0,0,0,0]], ...bc(3),  name:'S'    },
  { shape:[[0,0,0,0],[1,1,0,0],[0,1,1,0],[0,0,0,0]], ...bc(4),  name:'Z'    },
  { shape:[[0,0,0,0],[1,0,0,0],[1,1,1,0],[0,0,0,0]], ...bc(5),  name:'L'    },
  { shape:[[0,0,0,0],[0,0,1,0],[1,1,1,0],[0,0,0,0]], ...bc(6),  name:'J'    },
  { shape:[[0,1,0],[1,1,1],[0,1,0]],                  ...bc(7),  name:'PLUS' },
  { shape:[[1,1,1,1,1]],                               ...bc(8),  name:'5ER'  },
  { shape:[[1,1],[1,1],[1,0]],                         ...bc(9),  name:'L2'   },
  { shape:[[1,0,1],[0,1,0],[1,0,1]],                   ...bc(10), name:'X'    },
];

// Mobile: smaller pieces (max 3 cells wide, simpler shapes)
const TETROMINOS_MOBILE = [
  { shape:[[1,1,1]],         ...bc(0),  name:'I3'   },
  { shape:[[1,1],[1,1]],     ...bc(1),  name:'O'    },
  { shape:[[1,1,0],[0,1,1]], ...bc(2),  name:'S'    },
  { shape:[[0,1,1],[1,1,0]], ...bc(3),  name:'Z'    },
  { shape:[[1,0],[1,1],[0,1]],...bc(4), name:'S2'   },
  { shape:[[0,1],[1,1],[1,0]],...bc(5), name:'Z2'   },
  { shape:[[1,0],[1,0],[1,1]],...bc(6), name:'L'    },
  { shape:[[0,1],[0,1],[1,1]],...bc(7), name:'J'    },
  { shape:[[0,1,0],[1,1,1]], ...bc(8),  name:'T'    },
  { shape:[[1,1,1],[0,1,0]], ...bc(9),  name:'T2'   },
  { shape:[[1,1],[0,1],[0,1]],...bc(10),name:'L3'   },
  { shape:[[1,1,1],[1,0,0]], ...bc(11), name:'L4'   },
];

// ─── Power-up tetrominos ──────────────────────────────────────────────────────
interface PUDef {
  shape:number[][];color:string;border:string;name:string;effect:string;
  glow:string;symbol:string;pulse:string;accent:string;
}
// Desktop power-ups (4-wide shapes)
const POWERUPS_DESKTOP: PUDef[] = [
  { shape:[[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]], color:'#FF3A1A',border:'#991200',name:'BOMBE',     effect:'bomb',        glow:'#FF6040',symbol:'circle',  pulse:'flicker',accent:'#FFD0C0'},
  { shape:[[0,0,0,0],[0,1,1,0],[0,1,1,0],[0,0,0,0]], color:'#1E3A6E',border:'#080E1F',name:'LASER',     effect:'laser',       glow:'#4080FF',symbol:'bolt',    pulse:'spin',   accent:'#80B0FF'},
  { shape:[[0,0,0,0],[0,1,0,0],[1,1,1,0],[0,0,0,0]], color:'#FFC27A',border:'#B07020',name:'3x',        effect:'scndBonus',   glow:'#FFD060',symbol:'star',    pulse:'breathe',accent:'#FFF0A0'},
  { shape:[[0,0,0,0],[0,1,1,0],[1,1,0,0],[0,0,0,0]], color:'#58D1C6',border:'#1A8A80',name:'FREEZE',    effect:'freeze',      glow:'#88EEFF',symbol:'diamond', pulse:'ripple', accent:'#CCFFFF'},
  { shape:[[0,0,0,0],[1,0,0,0],[1,1,1,0],[0,0,0,0]], color:'#4D8A70',border:'#1E5040',name:'GRAVITY',   effect:'gravity',     glow:'#76C662',symbol:'arc',     pulse:'bounce', accent:'#B7D354'},
  { shape:[[0,0,0,0],[0,0,1,0],[1,1,1,0],[0,0,0,0]], color:'#55629B',border:'#1E3060',name:'SWAP',      effect:'swap',        glow:'#9B70B8',symbol:'cross',   pulse:'spin',   accent:'#D0C0FF'},
  { shape:[[0,0,0,0],[1,1,0,0],[0,1,1,0],[0,0,0,0]], color:'#9B70B8',border:'#5A2880',name:'CLEAR',     effect:'clearLine',   glow:'#C080FF',symbol:'wave',    pulse:'flicker',accent:'#E8D0FF'},
  { shape:[[1,1],[1,1]],                               color:'#FFDC71',border:'#C8A800',name:'2x',        effect:'doubleScore', glow:'#FFD700',symbol:'square',  pulse:'breathe',accent:'#FFFACC'},
  { shape:[[0,1,0],[1,1,1],[0,1,0]],                  color:'#E5E0D8',border:'#C8C0B0',name:'SHIELD',    effect:'shield',      glow:'#FFFFFF',symbol:'ring',    pulse:'ripple', accent:'#538BB9'},
  { shape:[[1,1,1],[1,1,1],[1,1,1]],                  color:'#C45B63',border:'#7A2030',name:'MEGA',      effect:'megaBomb',    glow:'#FF4060',symbol:'triangle',pulse:'flicker',accent:'#FFB0B8'},
  { shape:[[0,1,0],[1,1,1],[0,1,0]],                  color:'#EA8E77',border:'#A84830',name:'METEOR',    effect:'meteor',      glow:'#FF8C00',symbol:'spark',   pulse:'bounce', accent:'#FFD0A0'},
  { shape:[[1,1,1],[1,0,1],[1,1,1]],                  color:'#355D68',border:'#102830',name:'REWIND',    effect:'rewind',      glow:'#58D1C6',symbol:'dot',     pulse:'spin',   accent:'#A0EEFF'},
];
// Mobile power-ups (3-wide max)
const POWERUPS_MOBILE: PUDef[] = [
  { shape:[[1,1,1]],         color:'#FF3A1A',border:'#991200',name:'BOMBE',   effect:'bomb',        glow:'#FF6040',symbol:'circle', pulse:'flicker',accent:'#FFD0C0'},
  { shape:[[1,1],[1,1]],     color:'#1E3A6E',border:'#080E1F',name:'LASER',   effect:'laser',       glow:'#4080FF',symbol:'bolt',   pulse:'spin',   accent:'#80B0FF'},
  { shape:[[0,1,0],[1,1,1]], color:'#FFC27A',border:'#B07020',name:'3x',      effect:'scndBonus',   glow:'#FFD060',symbol:'star',   pulse:'breathe',accent:'#FFF0A0'},
  { shape:[[1,1,0],[0,1,1]], color:'#58D1C6',border:'#1A8A80',name:'FREEZE',  effect:'freeze',      glow:'#88EEFF',symbol:'diamond',pulse:'ripple', accent:'#CCFFFF'},
  { shape:[[1,0],[1,1],[0,1]],color:'#4D8A70',border:'#1E5040',name:'GRAVITY',effect:'gravity',     glow:'#76C662',symbol:'arc',    pulse:'bounce', accent:'#B7D354'},
  { shape:[[1,1],[1,1]],     color:'#FFDC71',border:'#C8A800',name:'2x',      effect:'doubleScore', glow:'#FFD700',symbol:'square', pulse:'breathe',accent:'#FFFACC'},
  { shape:[[0,1,0],[1,1,1]], color:'#E5E0D8',border:'#C8C0B0',name:'SHIELD',  effect:'shield',      glow:'#FFFFFF',symbol:'ring',   pulse:'ripple', accent:'#538BB9'},
  { shape:[[1,1,1],[1,1,1]], color:'#C45B63',border:'#7A2030',name:'MEGA',    effect:'megaBomb',    glow:'#FF4060',symbol:'triangle',pulse:'flicker',accent:'#FFB0B8'},
  { shape:[[1,1,1]],         color:'#355D68',border:'#102830',name:'REWIND',  effect:'rewind',      glow:'#58D1C6',symbol:'dot',    pulse:'spin',   accent:'#A0EEFF'},
];

// ─── Types ────────────────────────────────────────────────────────────────────
interface Cell {
  color:string; border:string;
  isPowerUp?:boolean; effect?:string; glow?:string;
  symbol?:string; pulse?:string; accent?:string;
  isIce?:boolean; isGold?:boolean;
}
interface Piece {
  shape:number[][]; color:string; border:string; name:string;
  isPowerUp?:boolean; effect?:string; glow?:string;
  symbol?:string; pulse?:string; accent?:string;
}
interface GlobalHS  { player_name:string; score:number; }
interface LocalHS   { name:string; score:number; date:string; }
interface SavedState { board:(Cell|null)[][]; score:number; lines:number; level:number; combo:number; }
interface Particle  { x:number; y:number; vx:number; vy:number; life:number; color:string; size:number; }

// ─── Personal best (localStorage, single entry) ───────────────────────────────
const LOCAL_KEY = 'scnd_drop_personal_best';
function loadPersonalBest(): LocalHS | null {
  if (typeof window === 'undefined') return null;
  try { const raw = localStorage.getItem(LOCAL_KEY); return raw ? JSON.parse(raw) : null; } catch { return null; }
}
function savePersonalBest(entry: LocalHS) {
  const current = loadPersonalBest();
  // Only overwrite if new score is higher (or no entry yet)
  if (!current || entry.score > current.score) {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(entry));
    return true; // new record
  }
  return false;
}

// ─── Pure helpers ─────────────────────────────────────────────────────────────
const emptyBoard = (W: number, H: number): (Cell|null)[][] =>
  Array.from({ length: H }, () => Array(W).fill(null));

function rotateCW(s: number[][]): number[][] {
  const r = s.length, c = s[0].length;
  return Array.from({ length: c }, (_, ci) => Array.from({ length: r }, (_, ri) => s[r-1-ri][ci]));
}
function gravDir(rot: Rot): { dx: number; dy: number } {
  switch (rot) { case 0: return {dx:0,dy:1}; case 90: return {dx:1,dy:0}; case 180: return {dx:0,dy:-1}; case 270: return {dx:-1,dy:0}; }
}
function s2b(sdx: number, sdy: number, rot: Rot): { dx: number; dy: number } {
  switch (rot) { case 0: return {dx:sdx,dy:sdy}; case 90: return {dx:sdy,dy:-sdx}; case 180: return {dx:-sdx,dy:-sdy}; case 270: return {dx:-sdy,dy:sdx}; }
}
function anchorMask(board: (Cell|null)[][], W: number, H: number): boolean[][] {
  const vis: boolean[][] = Array.from({ length: H }, () => Array(W).fill(false));
  const q: [number,number][] = [];
  for (let x = 0; x < W; x++) {
    if (board[0][x])   { vis[0][x]   = true; q.push([0,x]); }
    if (board[H-1][x]) { vis[H-1][x] = true; q.push([H-1,x]); }
  }
  for (let y = 0; y < H; y++) {
    if (board[y][0])   { vis[y][0]   = true; q.push([y,0]); }
    if (board[y][W-1]) { vis[y][W-1] = true; q.push([y,W-1]); }
  }
  while (q.length) {
    const [y,x] = q.pop()!;
    for (const [ny,nx] of [[y-1,x],[y+1,x],[y,x-1],[y,x+1]] as [number,number][]) {
      if (ny>=0&&ny<H&&nx>=0&&nx<W&&!vis[ny][nx]&&board[ny][nx]) { vis[ny][nx]=true; q.push([ny,nx]); }
    }
  }
  return vis;
}
function stepGrav(board: (Cell|null)[][], rot: Rot, W: number, H: number): { board:(Cell|null)[][]; moved:boolean } {
  const anch = anchorMask(board, W, H);
  const next = board.map(r => [...r]) as (Cell|null)[][];
  let moved = false;
  const { dx, dy } = gravDir(rot);
  const ys = dy===1 ? Array.from({length:H},(_,i)=>H-1-i) : dy===-1 ? Array.from({length:H},(_,i)=>i) : Array.from({length:H},(_,i)=>i);
  const xs = dx===1 ? Array.from({length:W},(_,i)=>W-1-i) : dx===-1 ? Array.from({length:W},(_,i)=>i) : Array.from({length:W},(_,i)=>i);
  for (const y of ys) for (const x of xs) {
    if (!next[y][x] || anch[y][x]) continue;
    const ny = y+dy, nx = x+dx;
    if (ny<0||ny>=H||nx<0||nx>=W||next[ny][nx]) continue;
    next[ny][nx] = next[y][x]; next[y][x] = null; moved = true;
  }
  return { board: next, moved };
}
function settle(board: (Cell|null)[][], rot: Rot, W: number, H: number): (Cell|null)[][] {
  let cur = board;
  for (let i = 0; i < W+H; i++) { const { board:nxt, moved } = stepGrav(cur, rot, W, H); cur = nxt; if (!moved) break; }
  return cur;
}
function clearLines(board: (Cell|null)[][], cs: number, W: number, H: number, burst: (x:number,y:number)=>void): { board:(Cell|null)[][]; cleared:number } {
  const del = new Set<number>();
  // Line threshold: 75% of grid width (so 15 on 20-wide, 11 on 15-wide)
  const threshold = Math.max(8, Math.floor(W * 0.75));
  const check = (cells: [number,number][]) => {
    let run: [number,number][] = [];
    for (const [y,x] of [...cells,[-1,-1] as [number,number]]) {
      if (y>=0&&x>=0&&board[y][x]) run.push([y,x]);
      else { if (run.length >= threshold) run.forEach(([ry,rx]) => del.add(ry*W+rx)); run = []; }
    }
  };
  for (let y = 0; y < H; y++) check(Array.from({length:W},(_,x)=>[y,x] as [number,number]));
  for (let x = 0; x < W; x++) check(Array.from({length:H},(_,y)=>[y,x] as [number,number]));
  if (!del.size) return { board, cleared: 0 };
  const next = board.map(r => [...r]) as (Cell|null)[][];
  let cleared = 0;
  for (const code of del) {
    const y = Math.floor(code/W), x = code%W;
    if (next[y][x]) { burst(x*cs+cs/2, y*cs+cs/2); next[y][x] = null; cleared++; }
  }
  return { board: next, cleared };
}

// ─── Cell size: fill available area ──────────────────────────────────────────
function calcCellSize(containerW: number, containerH: number, BW: number, BH: number): number {
  const byW = Math.floor((containerW - 4) / BW);
  const byH = Math.floor((containerH - 4) / BH);
  return Math.min(Math.max(8, Math.min(byW, byH)), 64);
}

// ─── S-curve speed function ───────────────────────────────────────────────────
// Level 1 = 2200ms (very relaxed), Level 100 = 450ms (~2 blocks/s, still playable)
// S-curve: slow ramp at start, gentle middle, flat end – no sudden jumps
function getFallMsForLevel(level: number): number {
  const t = Math.min(level - 1, 99) / 99; // 0..1 over 99 levels
  // Cubic ease-in-out S-curve
  const s = t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t + 2, 3) / 2;
  // s=0 → 2200ms, s=1 → 450ms
  return Math.round(2200 - s * (2200 - 450));
}

// ─── Canvas symbol drawing ────────────────────────────────────────────────────
function drawSym(ctx: CanvasRenderingContext2D, sym: string, cx: number, cy: number, cs: number, col: string, t: number) {
  const r = cs * 0.27;
  ctx.save(); ctx.translate(cx, cy);
  ctx.strokeStyle = col; ctx.fillStyle = col;
  ctx.lineWidth = Math.max(1, cs*0.08); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  switch (sym) {
    case 'circle':   ctx.beginPath(); ctx.arc(0,0,r,0,Math.PI*2); ctx.stroke(); break;
    case 'diamond':  { const d=r*0.9; ctx.beginPath(); ctx.moveTo(0,-d); ctx.lineTo(d,0); ctx.lineTo(0,d); ctx.lineTo(-d,0); ctx.closePath(); ctx.stroke(); break; }
    case 'cross':    ctx.beginPath(); ctx.moveTo(-r,0); ctx.lineTo(r,0); ctx.moveTo(0,-r); ctx.lineTo(0,r); ctx.stroke(); break;
    case 'ring':     ctx.beginPath(); ctx.arc(0,0,r,0,Math.PI*2); ctx.stroke(); ctx.beginPath(); ctx.arc(0,0,r*0.45,0,Math.PI*2); ctx.stroke(); break;
    case 'triangle': ctx.beginPath(); ctx.moveTo(0,-r); ctx.lineTo(r*0.87,r*0.5); ctx.lineTo(-r*0.87,r*0.5); ctx.closePath(); ctx.stroke(); break;
    case 'wave':     { ctx.beginPath(); for(let i=-r;i<=r;i++){const wy=Math.sin((i/r)*Math.PI+t)*r*0.4;if(i===-r)ctx.moveTo(i,wy);else ctx.lineTo(i,wy);} ctx.stroke(); break; }
    case 'star':     { ctx.beginPath(); for(let i=0;i<10;i++){const a=(i*Math.PI)/5-Math.PI/2;const rad=i%2===0?r:r*0.4;if(i===0)ctx.moveTo(Math.cos(a)*rad,Math.sin(a)*rad);else ctx.lineTo(Math.cos(a)*rad,Math.sin(a)*rad);} ctx.closePath(); ctx.stroke(); break; }
    case 'square':   ctx.strokeRect(-r*0.8,-r*0.8,r*1.6,r*1.6); break;
    case 'bolt':     ctx.beginPath(); ctx.moveTo(r*0.2,-r); ctx.lineTo(-r*0.3,0); ctx.lineTo(r*0.2,0); ctx.lineTo(-r*0.2,r); ctx.stroke(); break;
    case 'spark':    for(let i=0;i<4;i++){const a=(i*Math.PI)/2+t*0.5;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r);ctx.stroke();} break;
    case 'arc':      ctx.beginPath(); ctx.arc(0,r*0.15,r*0.75,Math.PI*1.1,Math.PI*1.9); ctx.stroke(); ctx.beginPath(); ctx.moveTo(-r*0.2,r*0.55); ctx.lineTo(0,r*0.85); ctx.lineTo(r*0.2,r*0.55); ctx.stroke(); break;
    case 'dot':      ctx.beginPath(); ctx.arc(0,0,r*0.4,0,Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(0,0,r,0,Math.PI*2); ctx.stroke(); break;
    default: break;
  }
  ctx.restore();
}

// ─── Detect dark mode ─────────────────────────────────────────────────────────
function useIsDark(): boolean {
  const [isDark, setIsDark] = useState(true);
  useEffect(() => {
    const check = () => setIsDark(!document.documentElement.classList.contains('light'));
    check();
    const obs = new MutationObserver(check);
    obs.observe(document.documentElement, { attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);
  return isDark;
}

// ─── Detect mobile ────────────────────────────────────────────────────────────
function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 600);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  return isMobile;
}

// ─── Component ────────────────────────────────────────────────────────────────
export function ScndDropGame() {
  const areaRef    = useRef<HTMLDivElement>(null);
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const isDark     = useIsDark();
  const isMobile   = useIsMobile();
  const isDarkRef  = useRef(isDark);
  const isMobRef   = useRef(isMobile);
  useEffect(() => { isDarkRef.current = isDark; }, [isDark]);
  useEffect(() => { isMobRef.current = isMobile; }, [isMobile]);

  // Board dims refs (updated when isMobile changes)
  const WRef = useRef(20);
  const HRef = useRef(20);
  useEffect(() => {
    const d = getBoardDims(isMobile);
    WRef.current = d.W; HRef.current = d.H;
  }, [isMobile]);

  // Game refs
  const boardRef    = useRef<(Cell|null)[][]>(emptyBoard(20, 20));
  const pieceRef    = useRef<Piece|null>(null);
  const pxRef       = useRef(0);
  const pyRef       = useRef(0);
  const rotRef      = useRef<Rot>(0);
  const scoreRef    = useRef(0);
  const levelRef    = useRef(1);
  const linesRef    = useRef(0);
  const comboRef    = useRef(0);
  const playRef     = useRef(false);
  const pauseRef    = useRef(false);
  const goRef       = useRef(false);
  const freezeRef   = useRef(false);
  const slowRef     = useRef(false);
  const fastRef     = useRef(false);
  const shieldRef   = useRef(false);
  const doubleRef   = useRef(false);
  const scndRef     = useRef(false);
  const pulseRef    = useRef(0);
  const partsRef    = useRef<Particle[]>([]);
  const histRef     = useRef<SavedState[]>([]);
  const csRef       = useRef(20);
  const rafRef      = useRef(0);
  const lastFallRef = useRef(0);
  const gravRaf     = useRef(0);
  const lastGravRef = useRef(0);
  const bpRef       = useRef(0);
  const bpLimRef    = useRef(Math.floor(Math.random()*5)+3);

  // UI state
  const [uiScore,   setUiScore]   = useState(0);
  const [uiLevel,   setUiLevel]   = useState(1);
  const [uiLines,   setUiLines]   = useState(0);
  const [uiCombo,   setUiCombo]   = useState(0);
  const [playing,   setPlaying]   = useState(false);
  const [paused,    setPaused]    = useState(false);
  const [gameOver,  setGameOver]  = useState(false);
  const [finalSc,   setFinalSc]   = useState(0);
  const [bonus,     setBonus]     = useState('');
  const [puName,    setPuName]    = useState('');
  const [flags,     setFlags]     = useState({ freeze:false,slow:false,fast:false,shield:false,double:false,scnd:false });
  const [globalHS,  setGlobalHS]  = useState<GlobalHS[]>([]);
  const [personalBest, setPersonalBest] = useState<LocalHS | null>(null);
  const [isNewRecord,  setIsNewRecord]  = useState(false);
  const [showName,  setShowName]  = useState(false);
  const [pname,     setPname]     = useState('');
  const [saving,    setSaving]    = useState(false);
  const [csize,     setCsize]     = useState({ w: 200, h: 200 });

  // Load personal best on mount
  useEffect(() => { setPersonalBest(loadPersonalBest()); }, []);

  // ── Adaptive sizing ──────────────────────────────────────────────────
  const recalc = useCallback(() => {
    if (!areaRef.current) return;
    const r = areaRef.current.getBoundingClientRect();
    const bw = WRef.current, bh = HRef.current;
    const cs = calcCellSize(r.width, r.height, bw, bh);
    csRef.current = cs;
    setCsize({ w: bw * cs, h: bh * cs });
  }, []);

  useEffect(() => {
    recalc();
    const ro = new ResizeObserver(recalc);
    if (areaRef.current) ro.observe(areaRef.current);
    return () => ro.disconnect();
  }, [recalc, isMobile]);

  // helpers
  const updFlags = useCallback(() => {
    setFlags({ freeze:freezeRef.current, slow:slowRef.current, fast:fastRef.current,
               shield:shieldRef.current, double:doubleRef.current, scnd:scndRef.current });
  }, []);
  const showBonus = useCallback((t: string) => { setBonus(t); setTimeout(() => setBonus(''), 1800); }, []);
  const burst = useCallback((bx: number, by: number, n = 10) => {
    const cols = [BRAND,'#FF8800','#FFDC71','#76C662','#58D1C6','#9B70B8','#EA8E77'];
    for (let i = 0; i < n; i++) partsRef.current.push({
      x:bx, y:by, vx:(Math.random()-.5)*6, vy:(Math.random()-.5)*6,
      life:1, size:2+Math.random()*3, color:cols[Math.floor(Math.random()*cols.length)],
    });
  }, []);

  // collision
  const hits = useCallback((shape: number[][], ox: number, oy: number): boolean => {
    const b = boardRef.current, W = WRef.current, H = HRef.current;
    for (let y = 0; y < shape.length; y++) for (let x = 0; x < shape[y].length; x++) {
      if (!shape[y][x]) continue;
      const bx = ox+x, by = oy+y;
      if (bx<0||bx>=W||by<0||by>=H) return true;
      if (b[by][bx]) return true;
    }
    return false;
  }, []);

  const ghost = useCallback(() => {
    const p = pieceRef.current!;
    const { dx, dy } = gravDir(rotRef.current);
    let gx = pxRef.current, gy = pyRef.current;
    while (!hits(p.shape, gx+dx, gy+dy)) { gx += dx; gy += dy; }
    return { x: gx, y: gy };
  }, [hits]);

  // spawn
  const spawn = useCallback((): boolean => {
    const mob = isMobRef.current;
    const isPU = Math.random() < 0.14;
    const pool = isPU ? (mob ? POWERUPS_MOBILE : POWERUPS_DESKTOP) : (mob ? TETROMINOS_MOBILE : TETROMINOS_DESKTOP);
    const src = pool[Math.floor(Math.random() * pool.length)];
    const piece: Piece = {
      shape: src.shape.map(r => [...r]),
      color: src.color, border: src.border, name: src.name, isPowerUp: isPU,
      effect: isPU ? (src as PUDef).effect : undefined,
      glow:   isPU ? (src as PUDef).glow   : undefined,
      symbol: isPU ? (src as PUDef).symbol : undefined,
      pulse:  isPU ? (src as PUDef).pulse  : undefined,
      accent: isPU ? (src as PUDef).accent : undefined,
    };
    const W = WRef.current, H = HRef.current;
    const pw = piece.shape[0].length, ph = piece.shape.length;
    const cx = Math.floor((W - pw) / 2), cy = Math.floor((H - ph) / 2);
    for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) {
      const tx = cx+dx, ty = cy+dy;
      if (tx>=0&&tx+pw<=W&&ty>=0&&ty+ph<=H&&!hits(piece.shape,tx,ty)) {
        pieceRef.current = piece; pxRef.current = tx; pyRef.current = ty; return true;
      }
    }
    return false;
  }, [hits]);

  // power-up
  const triggerPU = useCallback((effect: string, px: number, py: number, name: string) => {
    setPuName(name); showBonus(`${name} AKTIVIERT`);
    const cs = csRef.current, W = WRef.current, H = HRef.current;
    burst(px*cs+cs/2, py*cs+cs/2, 30);
    const b = boardRef.current.map(r => [...r]) as (Cell|null)[][];
    switch (effect) {
      case 'bomb':
        for (let dy=-2;dy<=2;dy++) for (let dx=-2;dx<=2;dx++) {
          const nx=px+dx,ny=py+dy;
          if (nx>=0&&nx<W&&ny>=0&&ny<H&&b[ny][nx]) { burst(nx*cs+cs/2,ny*cs+cs/2,4); b[ny][nx]=null; }
        }
        boardRef.current = settle(b, rotRef.current, W, H); break;
      case 'laser':
        for (let x=0;x<W;x++) if (b[py][x]) { burst(x*cs+cs/2,py*cs+cs/2,4); b[py][x]=null; }
        boardRef.current = settle(b, rotRef.current, W, H); break;
      case 'scndBonus': scndRef.current=true; updFlags(); setTimeout(()=>{scndRef.current=false;updFlags();},30000); break;
      case 'freeze':    freezeRef.current=true; updFlags(); setTimeout(()=>{freezeRef.current=false;updFlags();},3000); break;
      case 'gravity':   boardRef.current = settle(b, rotRef.current, W, H); break;
      case 'swap': {
        const bl:{y:number;x:number}[]=[];
        for (let y=0;y<H;y++) for (let x=0;x<W;x++) if(b[y][x]) bl.push({y,x});
        if (bl.length>=2) {
          const ai=Math.floor(Math.random()*bl.length);
          let bi=Math.floor(Math.random()*bl.length); while(bi===ai)bi=Math.floor(Math.random()*bl.length);
          const a=bl[ai],bk=bl[bi]; [b[a.y][a.x],b[bk.y][bk.x]]=[b[bk.y][bk.x],b[a.y][a.x]];
          boardRef.current=b;
        }
        break;
      }
      case 'clearLine': {
        const row=Math.floor(Math.random()*H);
        for (let x=0;x<W;x++) if(b[row][x]){burst(x*cs+cs/2,row*cs+cs/2,4);b[row][x]=null;}
        boardRef.current=settle(b,rotRef.current,W,H); break;
      }
      case 'doubleScore': doubleRef.current=true; updFlags(); setTimeout(()=>{doubleRef.current=false;updFlags();},10000); break;
      case 'shield':      shieldRef.current=true; updFlags(); setTimeout(()=>{shieldRef.current=false;updFlags();},10000); break;
      case 'megaBomb':
        for (let dy=-3;dy<=3;dy++) for (let dx=-3;dx<=3;dx++) {
          const nx=px+dx,ny=py+dy;
          if (nx>=0&&nx<W&&ny>=0&&ny<H&&b[ny][nx]){burst(nx*cs+cs/2,ny*cs+cs/2,6);b[ny][nx]=null;}
        }
        boardRef.current=settle(b,rotRef.current,W,H); break;
      case 'meteor': {
        const col=Math.floor(Math.random()*W);
        for (let y=0;y<H;y++) if(b[y][col]){burst(col*cs+cs/2,y*cs+cs/2,4);b[y][col]=null;}
        boardRef.current=settle(b,rotRef.current,W,H); break;
      }
      case 'rewind':
        if (histRef.current.length>0) {
          const st=histRef.current.pop()!;
          boardRef.current=st.board; scoreRef.current=st.score; linesRef.current=st.lines;
          levelRef.current=st.level; comboRef.current=st.combo;
          setUiScore(st.score); setUiLines(st.lines); setUiLevel(st.level); setUiCombo(st.combo);
          showBonus('ZEITREISE!');
        }
        break;
      default: break;
    }
    setTimeout(() => setPuName(''), 2500);
  }, [burst, showBonus, updFlags]);

  // merge
  const merge = useCallback(() => {
    const p = pieceRef.current; if (!p) return;
    const W = WRef.current, H = HRef.current;
    histRef.current = [...histRef.current.slice(-4), {
      board: boardRef.current.map(r=>[...r]), score:scoreRef.current,
      lines:linesRef.current, level:levelRef.current, combo:comboRef.current,
    }];
    let nb = boardRef.current.map(r=>[...r]) as (Cell|null)[][];
    const pus: {x:number;y:number;effect:string;name:string}[] = [];
    for (let y=0;y<p.shape.length;y++) for (let x=0;x<p.shape[y].length;x++) {
      if (!p.shape[y][x]) continue;
      const bx=pxRef.current+x, by=pyRef.current+y;
      if (bx<0||bx>=W||by<0||by>=H) continue;
      nb[by][bx] = {
        color:p.color, border:p.border, isPowerUp:p.isPowerUp,
        effect:p.effect, glow:p.glow, symbol:p.symbol, pulse:p.pulse, accent:p.accent,
        isIce:  !p.isPowerUp&&Math.random()<0.05,
        isGold: !p.isPowerUp&&Math.random()<0.04,
      };
      if (p.isPowerUp&&p.effect) pus.push({x:bx,y:by,effect:p.effect,name:p.name});
    }
    const cs = csRef.current;
    const { board:ac, cleared } = clearLines(nb, cs, W, H, burst);
    nb = settle(ac, rotRef.current, W, H);
    boardRef.current = nb;
    let added = 0;
    if (cleared > 0) {
      const base = [0,400,1000,3000,12000];
      comboRef.current += 1;
      let m = 1 + comboRef.current * 0.3;
      if (scndRef.current) m *= 3; if (doubleRef.current) m *= 2;
      added = Math.floor(base[Math.min(cleared,4)] * m);
    } else comboRef.current = 0;
    scoreRef.current += added; linesRef.current += cleared;
    levelRef.current = Math.floor(linesRef.current / 8) + 1;
    setUiScore(scoreRef.current); setUiLines(linesRef.current);
    setUiLevel(levelRef.current); setUiCombo(comboRef.current);
    for (const pu of pus) triggerPU(pu.effect, pu.x, pu.y, pu.name);
    bpRef.current++;
    if (bpRef.current >= bpLimRef.current) {
      bpRef.current = 0; bpLimRef.current = Math.floor(Math.random()*5)+3; doRot();
    }
    if (!spawn()) endGame();
  }, [burst, spawn, triggerPU]);

  // movement
  const move = useCallback((sdx: number, sdy: number) => {
    const p = pieceRef.current;
    if (!p||!playRef.current||pauseRef.current||goRef.current||freezeRef.current) return;
    const { dx, dy } = s2b(sdx, sdy, rotRef.current);
    const nx = pxRef.current+dx, ny = pyRef.current+dy;
    if (!hits(p.shape, nx, ny)) { pxRef.current = nx; pyRef.current = ny; }
    else if (sdy === 1) merge();
  }, [hits, merge]);

  const rotPiece = useCallback(() => {
    const p = pieceRef.current;
    if (!p||!playRef.current||pauseRef.current||goRef.current||freezeRef.current) return;
    const r = rotateCW(p.shape);
    if (!hits(r, pxRef.current, pyRef.current)) pieceRef.current = { ...p, shape: r };
  }, [hits]);

  const doRot = useCallback(() => {
    const rots: Rot[] = [0,90,180,270];
    let next = rots[Math.floor(Math.random()*4)] as Rot;
    while (next === rotRef.current) next = rots[Math.floor(Math.random()*4)] as Rot;
    rotRef.current = next;
    if (canvasRef.current) {
      canvasRef.current.style.transform = `rotate(${next}deg)`;
      canvasRef.current.style.transition = 'transform 0.4s cubic-bezier(0.2,0.9,0.4,1.1)';
    }
    if (typeof window !== 'undefined' && window.navigator.vibrate) window.navigator.vibrate(80);
  }, []);

  // end game
  const endGame = useCallback(() => {
    playRef.current = false; goRef.current = true;
    cancelAnimationFrame(rafRef.current); cancelAnimationFrame(gravRaf.current);
    setPlaying(false); setGameOver(true); setFinalSc(scoreRef.current);
    setIsNewRecord(false);
    // Only prompt for name entry if this score beats the personal best (or no entry yet)
    if (scoreRef.current > 0) {
      const pb = loadPersonalBest();
      if (!pb || scoreRef.current > pb.score) setShowName(true);
    }
    // Reload global
    fetch('/api/game-highscores').then(r=>r.json()).then(d=>{if(Array.isArray(d))setGlobalHS(d);}).catch(()=>{});
  }, []);

  // fall speed (S-curve)
  const getFallMs = useCallback((): number => {
    if (freezeRef.current) return Infinity;
    let ms = getFallMsForLevel(levelRef.current);
    if (slowRef.current) ms *= 2; if (fastRef.current) ms /= 2;
    return ms;
  }, []);

  // DRAW
  const draw = useCallback(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    const cs = csRef.current;
    const W = WRef.current, H = HRef.current;
    const cw = W*cs, ch = H*cs;
    canvas.width = cw; canvas.height = ch;
    const t = pulseRef.current;
    const T = getTheme(isDarkRef.current);

    ctx.fillStyle = T.canvasBg; ctx.fillRect(0, 0, cw, ch);
    ctx.strokeStyle = T.gridLine; ctx.lineWidth = 1;
    for (let x=0;x<=W;x++){ctx.beginPath();ctx.moveTo(x*cs,0);ctx.lineTo(x*cs,ch);ctx.stroke();}
    for (let y=0;y<=H;y++){ctx.beginPath();ctx.moveTo(0,y*cs);ctx.lineTo(cw,y*cs);ctx.stroke();}
    ctx.strokeStyle = BRAND; ctx.lineWidth = 2; ctx.strokeRect(1,1,cw-2,ch-2);

    const board = boardRef.current;
    for (let y=0;y<H;y++) for (let x=0;x<W;x++) {
      const cell = board[y][x]; if (!cell) continue;
      const cx = x*cs, cy = y*cs;
      if (cell.isPowerUp&&cell.glow) { ctx.shadowBlur=6+5*Math.sin(t*1.5); ctx.shadowColor=cell.glow; }
      ctx.fillStyle = cell.color; ctx.fillRect(cx, cy, cs-1, cs-1);
      ctx.fillStyle = cell.border; ctx.fillRect(cx, cy, cs-1, 2); ctx.fillRect(cx, cy, 2, cs-1);
      ctx.fillStyle = 'rgba(0,0,0,0.22)'; ctx.fillRect(cx, cy+cs-3, cs-1, 2); ctx.fillRect(cx+cs-3, cy, 2, cs-1);
      ctx.shadowBlur = 0;
      if (cell.isIce) { ctx.fillStyle='rgba(88,209,198,0.28)'; ctx.fillRect(cx,cy,cs-1,cs-1); ctx.fillStyle='rgba(255,255,255,0.5)'; ctx.fillRect(cx+cs*0.2,cy+cs*0.2,2,2); }
      if (cell.isGold) { const gs=0.25+0.2*Math.sin(t*2+x*0.7+y*0.5); ctx.fillStyle=`rgba(255,220,60,${gs})`; ctx.fillRect(cx,cy,cs-1,cs-1); }
      if (cell.isPowerUp&&cell.symbol&&cell.accent&&cs>=10) {
        const scl = cell.pulse==='breathe'?0.75+0.25*Math.sin(t*2):cell.pulse==='flicker'?(Math.random()>0.12?1:0.5):1;
        const ang = cell.pulse==='spin'?t*1.5:cell.pulse==='bounce'?Math.sin(t*3)*0.3:0;
        ctx.save(); ctx.translate(cx+cs/2,cy+cs/2); ctx.rotate(ang); ctx.scale(scl,scl); ctx.translate(-(cx+cs/2),-(cy+cs/2));
        drawSym(ctx, cell.symbol, cx+cs/2, cy+cs/2, cs, cell.accent, t);
        ctx.restore();
      }
    }

    const p = pieceRef.current;
    if (p&&!goRef.current&&!freezeRef.current&&!pauseRef.current) {
      const g = ghost();
      ctx.globalAlpha = isDarkRef.current ? 0.16 : 0.20;
      for (let y=0;y<p.shape.length;y++) for (let x=0;x<p.shape[y].length;x++) {
        if (!p.shape[y][x]) continue;
        const bx=g.x+x,by=g.y+y;
        if (bx>=0&&bx<W&&by>=0&&by<H) { ctx.fillStyle=p.color; ctx.fillRect(bx*cs,by*cs,cs-1,cs-1); }
      }
      ctx.globalAlpha = 1;
      ctx.shadowBlur = p.isPowerUp?(10+6*Math.sin(t*2)):(5+3*Math.sin(t));
      ctx.shadowColor = p.glow ?? BRAND; ctx.shadowOffsetY = 2;
      for (let y=0;y<p.shape.length;y++) for (let x=0;x<p.shape[y].length;x++) {
        if (!p.shape[y][x]) continue;
        const bx=pxRef.current+x,by=pyRef.current+y;
        if (bx>=0&&bx<W&&by>=0&&by<H) {
          ctx.fillStyle=p.color; ctx.fillRect(bx*cs,by*cs,cs-1,cs-1);
          ctx.fillStyle=p.border; ctx.fillRect(bx*cs,by*cs,cs-1,2); ctx.fillRect(bx*cs,by*cs,2,cs-1);
          ctx.fillStyle='rgba(0,0,0,0.22)'; ctx.fillRect(bx*cs,by*cs+cs-3,cs-1,2); ctx.fillRect(bx*cs+cs-3,by*cs,2,cs-1);
        }
      }
      ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
      if (p.isPowerUp&&p.symbol&&p.accent&&cs>=10) {
        for (let y=0;y<p.shape.length;y++) for (let x=0;x<p.shape[y].length;x++) {
          if (!p.shape[y][x]) continue;
          const bx=pxRef.current+x,by=pyRef.current+y;
          if (bx>=0&&bx<W&&by>=0&&by<H) {
            const scl=p.pulse==='breathe'?0.75+0.25*Math.sin(t*2):1;
            const ang=p.pulse==='spin'?t*1.5:p.pulse==='bounce'?Math.sin(t*3)*0.3:0;
            ctx.save(); ctx.translate(bx*cs+cs/2,by*cs+cs/2); ctx.rotate(ang); ctx.scale(scl,scl); ctx.translate(-(bx*cs+cs/2),-(by*cs+cs/2));
            drawSym(ctx, p.symbol, bx*cs+cs/2, by*cs+cs/2, cs, p.accent, t);
            ctx.restore();
          }
        }
      }
    }

    partsRef.current = partsRef.current.filter(pt=>pt.life>0);
    for (const pt of partsRef.current) {
      ctx.globalAlpha=pt.life; ctx.fillStyle=pt.color;
      ctx.fillRect(pt.x-pt.size/2, pt.y-pt.size/2, pt.size, pt.size);
      pt.x+=pt.vx; pt.y+=pt.vy; pt.vy+=0.1; pt.life-=0.04;
    }
    ctx.globalAlpha = 1;

    // Progress bar
    const thresh = Math.max(8, Math.floor(W*0.75));
    const prog = ((linesRef.current % thresh) / thresh) * cw;
    ctx.fillStyle = T.progressTrack; ctx.fillRect(0, ch-3, cw, 3);
    ctx.fillStyle = BRAND; ctx.fillRect(0, ch-3, prog, 3);
  }, [ghost]);

  // GAME LOOP
  const gameLoop = useCallback((now: number) => {
    if (!playRef.current||goRef.current||pauseRef.current) return;
    pulseRef.current = now * 0.008;
    const delay = getFallMs();
    if (delay!==Infinity&&now-lastFallRef.current>=delay) { move(0,1); lastFallRef.current=now; }
    draw();
    rafRef.current = requestAnimationFrame(gameLoop);
  }, [getFallMs, move, draw]);

  const gravLoop = useCallback((now: number) => {
    if (!playRef.current||goRef.current||pauseRef.current||freezeRef.current) {
      gravRaf.current = requestAnimationFrame(gravLoop); return;
    }
    if (now - lastGravRef.current >= 180) {
      const W = WRef.current, H = HRef.current;
      const { board:next, moved } = stepGrav(boardRef.current, rotRef.current, W, H);
      if (moved) {
        boardRef.current = next;
        const { board:ac, cleared } = clearLines(next, csRef.current, W, H, burst);
        if (cleared>0) { boardRef.current=settle(ac,rotRef.current,W,H); scoreRef.current+=cleared*50; setUiScore(scoreRef.current); }
      }
      lastGravRef.current = now;
    }
    gravRaf.current = requestAnimationFrame(gravLoop);
  }, [burst]);

  // start
  const startGame = useCallback(() => {
    cancelAnimationFrame(rafRef.current); cancelAnimationFrame(gravRaf.current);
    const mob = isMobRef.current;
    const { W, H } = getBoardDims(mob);
    WRef.current = W; HRef.current = H;
    boardRef.current = emptyBoard(W, H);
    scoreRef.current=0; levelRef.current=1; linesRef.current=0; comboRef.current=0;
    pieceRef.current=null; freezeRef.current=false; slowRef.current=false; fastRef.current=false;
    shieldRef.current=false; doubleRef.current=false; scndRef.current=false;
    partsRef.current=[]; histRef.current=[]; bpRef.current=0;
    bpLimRef.current = Math.floor(Math.random()*5)+3;
    goRef.current=false; pauseRef.current=false; playRef.current=true;
    const rots: Rot[] = [0,90,180,270];
    rotRef.current = rots[Math.floor(Math.random()*4)];
    if (canvasRef.current) canvasRef.current.style.transform = `rotate(${rotRef.current}deg)`;
    setUiScore(0); setUiLevel(1); setUiLines(0); setUiCombo(0);
    setGameOver(false); setPaused(false); setPuName(''); setBonus(''); setShowName(false); setIsNewRecord(false); updFlags();
    recalc();
    spawn(); setPlaying(true);
    const now = performance.now(); lastFallRef.current=now; lastGravRef.current=now;
    rafRef.current = requestAnimationFrame(gameLoop);
    gravRaf.current = requestAnimationFrame(gravLoop);
  }, [spawn, gameLoop, gravLoop, updFlags, recalc]);

  const togglePause = useCallback(() => {
    if (!playRef.current||goRef.current) return;
    pauseRef.current = !pauseRef.current; setPaused(pauseRef.current);
    if (!pauseRef.current) {
      const now = performance.now(); lastFallRef.current=now; lastGravRef.current=now;
      rafRef.current = requestAnimationFrame(gameLoop);
      gravRaf.current = requestAnimationFrame(gravLoop);
    } else { cancelAnimationFrame(rafRef.current); draw(); }
  }, [gameLoop, gravLoop, draw]);

  const giveUp = useCallback(() => { if (playRef.current&&!goRef.current) endGame(); }, [endGame]);

  // keyboard
  useEffect(() => {
    const ok = (e: KeyboardEvent) => {
      if (!playRef.current) return;
      switch (e.key) {
        case 'ArrowLeft':  e.preventDefault(); move(-1,0); break;
        case 'ArrowRight': e.preventDefault(); move(1,0);  break;
        case 'ArrowDown':  e.preventDefault(); move(0,1);  break;
        case 'ArrowUp':    e.preventDefault(); rotPiece(); break;
        case 'Escape':     e.preventDefault(); togglePause(); break;
      }
    };
    window.addEventListener('keydown', ok);
    return () => window.removeEventListener('keydown', ok);
  }, [move, rotPiece, togglePause]);

  // load global highscores
  useEffect(() => {
    fetch('/api/game-highscores').then(r=>r.json()).then(d=>{if(Array.isArray(d))setGlobalHS(d);}).catch(()=>{});
  }, []);

  // save highscore (local personal best + global)
  const saveHS = async () => {
    if (!pname.trim()||saving) return;
    setSaving(true);
    const entry: LocalHS = { name: pname.trim(), score: finalSc, date: new Date().toLocaleDateString('de-DE') };
    const wasNew = savePersonalBest(entry);
    setPersonalBest(loadPersonalBest());
    setIsNewRecord(wasNew);
    // Try global
    try {
      await fetch('/api/game-highscores', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({playerName:pname,score:finalSc}) });
      const d = await (await fetch('/api/game-highscores')).json();
      if (Array.isArray(d)) setGlobalHS(d);
    } catch { /* global save failed silently */ }
    setSaving(false); setShowName(false); setPname('');
    // isNewRecord stays true until next game starts
  };

  // ── Derived theme ─────────────────────────────────────────────────────
  const T = getTheme(isDark);
  const overlayBg = T.overlayBg;
  const panelStyle = { background: T.panelBg, border: `1px solid ${T.panelBorder}` };

  const activeBadges = [
    { on:flags.freeze, label:'FREEZE', col:'#58D1C6' },
    { on:flags.slow,   label:'SLOW',   col:'#55629B' },
    { on:flags.fast,   label:'FAST',   col:BRAND },
    { on:flags.shield, label:'SHIELD', col:'#E5E0D8' },
    { on:flags.double, label:'2×',     col:'#FFDC71' },
    { on:flags.scnd,   label:'3×',     col:'#FFC27A' },
  ].filter(f => f.on);

  // Mobile button size: scale to screen width
  const mbSize = isMobile ? Math.min(Math.max(52, Math.floor(window?.innerWidth ? (window.innerWidth - 80) / 6 : 52)), 80) : 52;

  // ─── render ────────────────────────────────────────────────────────────
  return (
    <div
      style={{ background: T.wrapperBg, borderColor: `${BRAND}35` }}
      className="w-full h-screen md:h-auto md:min-h-[600px] md:my-4 rounded-2xl border-2 flex flex-col overflow-hidden transition-colors duration-300"
    >
      {/* brand bar */}
      <div style={{ background: `linear-gradient(90deg,${BRAND_DIM},${BRAND},${BRAND_DIM})` }} className="h-0.5 flex-shrink-0" />

      {/* header */}
      <div className="flex-shrink-0 py-1 px-3 text-center">
        <h3 style={{ color: BRAND, letterSpacing:'0.18em' }} className="text-lg md:text-xl font-black uppercase">SCND DROP</h3>
        {activeBadges.length > 0 && (
          <div className="flex justify-center gap-1 mt-0.5 flex-wrap">
            {activeBadges.map(f => (
              <span key={f.label} style={{ color:f.col, border:`1px solid ${f.col}55`, background:`${f.col}18` }}
                className="px-1.5 py-0.5 rounded text-[7px] font-bold tracking-widest animate-pulse">{f.label}</span>
            ))}
          </div>
        )}
        {(bonus||puName) && (
          <div className="mt-0.5 animate-bounce">
            <span style={{ color:BRAND, borderColor:`${BRAND}40` }}
              className="inline-block px-2 py-0.5 text-[8px] font-bold tracking-wider border rounded-sm">{puName||bonus}</span>
          </div>
        )}
      </div>

      {/* main */}
      <div className="flex-1 flex flex-col md:flex-row gap-2 px-2 pb-1 min-h-0">

        {/* canvas */}
        <div ref={areaRef} className="flex-1 min-h-0 flex items-center justify-center relative">
          <div className="relative" style={{ width:csize.w, height:csize.h }}>
            <div className="absolute -inset-1 rounded pointer-events-none"
              style={{ boxShadow:`0 0 24px 2px ${BRAND}22` }} />
            <canvas ref={canvasRef}
              style={{
                display:'block', width:csize.w, height:csize.h,
                transform:`rotate(${rotRef.current}deg)`,
                transition:'transform 0.4s cubic-bezier(0.2,0.9,0.4,1.1)',
                imageRendering:'pixelated',
                border:`2px solid ${BRAND}`, borderRadius:3,
              }}
            />

            {/* PAUSE */}
            {paused && !gameOver && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded"
                style={{ background:overlayBg, backdropFilter:'blur(6px)' }}>
                <div style={{ color:BRAND }} className="text-base font-black tracking-[0.3em]">PAUSE</div>
                <OBtn label="WEITER"   onClick={togglePause} bg={BRAND}        fg={T.canvasBg} />
                <OBtn label="NEUSTART" onClick={startGame}   outline={BRAND}   fg={BRAND} />
                <OBtn label="AUFGEBEN" onClick={giveUp}      outline="#C45B63" fg="#C45B63" />
              </div>
            )}
            {!playing && !gameOver && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded"
                style={{ background:overlayBg, backdropFilter:'blur(4px)' }}>
                <div style={{ color:BRAND, letterSpacing:'0.2em' }} className="text-xl font-black">SCND DROP</div>
                <div style={{ color:T.textMuted }} className="text-[9px] text-center px-4">
                  {isMobile ? '15×15 Grid · Kleinere Stücke' : '20×20 Grid · Volle Stücke'}
                </div>
                <OBtn label="START" onClick={startGame} bg={BRAND} fg={T.canvasBg} />
              </div>
            )}
            {gameOver && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded"
                style={{ background:overlayBg, backdropFilter:'blur(6px)' }}>
                <div className="font-black text-base tracking-wider">
                  <span style={{ color:BRAND }}>GAME</span>
                  <span style={{ color:T.textPrimary }}> OVER</span>
                </div>
                <div style={{ color:BRAND }} className="text-2xl font-black tabular-nums">{finalSc.toLocaleString()}</div>
                <OBtn label="NEUSTART" onClick={startGame} bg={BRAND} fg={T.canvasBg} />
              </div>
            )}
          </div>
        </div>

        {/* sidebar */}
        <div className="flex-shrink-0 flex flex-row md:flex-col gap-2 md:w-40 pb-1">
          {/* score */}
          <div className="flex-1 md:flex-none rounded p-2" style={panelStyle}>
            <div style={{ color:T.textMuted }} className="text-[6px] uppercase tracking-widest text-center mb-0.5">PUNKTE</div>
            <div style={{ color:BRAND }} className="text-xl font-black tabular-nums text-center leading-none">
              {(gameOver?finalSc:uiScore).toLocaleString()}
            </div>
            <div className="flex justify-around mt-1.5">
              {([['LVL',uiLevel],['LN',uiLines],['×',uiCombo]] as [string,number][]).map(([l,v]) => (
                <div key={l} className="text-center">
                  <div style={{ color:T.textMuted }} className="text-[5px] uppercase tracking-wider">{l}</div>
                  <div style={{ color:T.textPrimary }} className="text-[10px] font-bold">{v}</div>
                </div>
              ))}
            </div>
          </div>

          {/* highscore panel */}
          <div className="flex-1 md:flex-none rounded overflow-hidden" style={panelStyle}>
            {/* ── Personal best – big and prominent ── */}
            <div className="px-2 pt-2 pb-2" style={{ background: isNewRecord ? `${BRAND}18` : 'transparent', borderBottom:`1px solid ${T.panelBorder}` }}>
              <div className="flex items-center justify-between mb-1">
                <div style={{ color:T.textMuted }} className="text-[6px] uppercase tracking-widest">Dein Rekord</div>
                {isNewRecord && (
                  <span style={{ color:'#FFDC71', background:`#FFDC7122`, border:`1px solid #FFDC7155` }}
                    className="text-[6px] font-black px-1.5 py-0.5 rounded tracking-wider animate-pulse">
                    ★ NEU
                  </span>
                )}
              </div>
              {personalBest ? (
                <>
                  <div style={{ color: isNewRecord ? BRAND : T.textPrimary }}
                    className="text-2xl font-black tabular-nums leading-none tracking-tight">
                    {personalBest.score.toLocaleString()}
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <span style={{ color:T.textPrimary }} className="text-[8px] font-bold truncate max-w-[80px]">
                      {personalBest.name}
                    </span>
                    <span style={{ color:T.textMuted }} className="text-[7px]">{personalBest.date}</span>
                  </div>
                  {/* Progress bar: current session vs best */}
                  {!gameOver && uiScore > 0 && (
                    <div className="mt-1.5">
                      <div className="h-1 rounded-full overflow-hidden" style={{ background: T.progressTrack }}>
                        <div className="h-full rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(100, Math.round((uiScore / personalBest.score) * 100))}%`, background: BRAND }} />
                      </div>
                      <div style={{ color:T.textMuted }} className="text-[5px] mt-0.5 text-right">
                        {Math.round((uiScore / personalBest.score) * 100)}% des Rekords
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div style={{ color:T.textMuted }} className="text-[8px] italic py-1">Spiel & schreibe Geschichte!</div>
              )}
            </div>

            {/* ── Global top 3 ── */}
            <div className="px-2 pt-1.5 pb-2">
              <div style={{ color:BRAND }} className="text-[6px] uppercase tracking-widest font-bold mb-1">Global Top 3</div>
              {globalHS.length === 0
                ? <div style={{ color:T.textMuted }} className="text-[7px] italic text-center">— keine —</div>
                : globalHS.map((hs, i) => (
                  <div key={i} className="flex justify-between items-center mb-0.5">
                    <span style={{ color:BRAND }} className="text-[7px] font-bold mr-0.5">{['I','II','III'][i]}</span>
                    <span style={{ color:T.textMuted }} className="text-[7px] flex-1 truncate">{hs.player_name}</span>
                    <span style={{ color:T.textPrimary }} className="text-[7px] font-bold tabular-nums">{hs.score.toLocaleString()}</span>
                  </div>
                ))
              }
            </div>
          </div>

          {/* controls desktop */}
          <div className="hidden md:block rounded p-2" style={panelStyle}>
            <div style={{ color:T.textMuted }} className="text-[5px] uppercase tracking-widest mb-1">Steuerung</div>
            {([['←→','Seite'],['↓','Fall'],['↑','Dreh'],['ESC','Pause']] as [string,string][]).map(([k,v]) => (
              <div key={k} className="flex justify-between items-center mb-0.5">
                <kbd style={{ borderColor:`${BRAND}40`, color:BRAND, background:T.canvasBg }}
                  className="px-1 py-0.5 text-[6px] font-mono border rounded">{k}</kbd>
                <span style={{ color:T.textMuted }} className="text-[6px]">{v}</span>
              </div>
            ))}
          </div>

          {playing && !gameOver && (
            <button onClick={giveUp}
              style={{ borderColor:'#C45B6355', color:'#C45B63AA' }}
              className="hidden md:block rounded py-0.5 text-[7px] font-bold uppercase tracking-widest border hover:opacity-80 transition">
              Aufgeben
            </button>
          )}
        </div>
      </div>

      {/* ── Mobile controls ─────────────────────────────────────────────── */}
      {playing && !gameOver && !paused && (
        <div style={{ background: T.panelBg, borderTopColor: T.panelBorder }}
          className="md:hidden flex-shrink-0 border-t py-3 px-4">
          <div className="flex items-center justify-between w-full max-w-sm mx-auto">
            {/* D-pad */}
            <div className="flex flex-col items-center gap-1.5">
              <MB label="↑" fn={rotPiece} size={mbSize} col={BRAND} bg={T.panelBg} />
              <div className="flex gap-1.5">
                <MB label="◀" fn={() => move(-1,0)} size={mbSize} col={BRAND} bg={T.panelBg} />
                <MB label="▼" fn={() => move(0,1)}  size={mbSize} col={BRAND} bg={T.panelBg} />
                <MB label="▶" fn={() => move(1,0)}  size={mbSize} col={BRAND} bg={T.panelBg} />
              </div>
            </div>
            {/* Action buttons */}
            <div className="flex flex-col gap-2">
              <MB label="ROT" fn={rotPiece}    size={mbSize} col={BRAND}        bg={BRAND}        filled />
              <MB label="⏸"  fn={togglePause} size={mbSize} col={T.textMuted}  bg={T.panelBg} />
            </div>
          </div>
          {/* Speed indicator */}
          <div className="flex justify-center mt-2 gap-3">
            <span style={{ color:T.textMuted }} className="text-[7px] uppercase tracking-widest">
              LVL {uiLevel} · {Math.round(getFallMsForLevel(uiLevel)/100)/10}s/Fall
            </span>
          </div>
        </div>
      )}

      {/* name modal */}
      {showName && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4"
          style={{ background: overlayBg, backdropFilter:'blur(8px)' }}>
          <div className="rounded-xl p-5 max-w-sm w-full shadow-2xl"
            style={{ background: T.panelBg, border:`2px solid ${BRAND}` }}>
            <h3 style={{ color:BRAND }} className="text-base font-black tracking-wider mb-0.5">HIGHSCORE</h3>
            <p style={{ color:T.textMuted }} className="text-[10px] mb-1">
              {personalBest && finalSc > personalBest.score ? '🏆 Neuer persönlicher Rekord!' : 'Lokal + global gespeichert'}
            </p>
            <p style={{ color:T.textMuted }} className="text-xs mb-3">
              Punktzahl: <span style={{ color:BRAND }} className="font-black text-base">{finalSc.toLocaleString()}</span>
            </p>
            <input type="text" value={pname}
              onChange={e => setPname(e.target.value)}
              onKeyDown={e => e.key==='Enter' && saveHS()}
              maxLength={15} autoFocus placeholder="DEIN NAME"
              style={{ background:T.canvasBg, borderColor:`${BRAND}70`, color:T.textPrimary, outline:'none' }}
              className="w-full p-2.5 border rounded mb-3 text-xs uppercase tracking-wider"
            />
            <div className="flex gap-2">
              <button onClick={saveHS} disabled={saving}
                style={{ background:BRAND, color:T.canvasBg }}
                className="flex-1 py-1.5 font-black text-xs uppercase tracking-wider rounded disabled:opacity-50 hover:opacity-90 transition">
                {saving ? '…' : 'SPEICHERN'}
              </button>
              <button onClick={() => setShowName(false)}
                style={{ borderColor:`${T.textMuted}50`, color:T.textMuted }}
                className="flex-1 py-1.5 font-bold text-xs uppercase tracking-wider rounded border hover:opacity-80 transition">
                SKIP
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── UI helpers ───────────────────────────────────────────────────────────────
function OBtn({ label, onClick, bg, fg, outline }: { label:string; onClick:()=>void; bg?:string; fg?:string; outline?:string }) {
  return (
    <button onClick={onClick}
      style={{ background:bg??'transparent', color:fg??'inherit', border:outline?`1px solid ${outline}`:'none' }}
      className="w-28 py-1 font-black text-[10px] uppercase tracking-widest rounded hover:opacity-85 active:scale-95 transition">
      {label}
    </button>
  );
}

function MB({ label, fn, size, col, bg, filled }: { label:string; fn:()=>void; size:number; col:string; bg:string; filled?:boolean }) {
  return (
    <button
      onTouchStart={e => { e.preventDefault(); fn(); }}
      style={{
        width: size, height: size,
        color: filled ? bg : col,
        background: filled ? col : `${col}16`,
        border: `2px solid ${col}${filled ? 'FF' : '60'}`,
        touchAction: 'none', userSelect: 'none',
        borderRadius: Math.round(size * 0.22),
        fontSize: Math.max(12, size * 0.35),
        fontWeight: 900,
        flexShrink: 0,
      }}
      className="flex items-center justify-center active:scale-90 transition-transform select-none">
      {label}
    </button>
  );
}
