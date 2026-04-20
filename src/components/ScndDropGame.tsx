'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

// ─── Brand ──────────────────────────────────────────────────────────────
const BRAND = '#FF4400';
const BRAND_DIM = '#CC3300';

// ─── Board (fest 15×15) ────────────────────────────────────────────────
const W = 15;
const H = 15;

// ─── Theme ──────────────────────────────────────────────────────────────
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

// ─── Blockfarben ────────────────────────────────────────────────────────
const BLOCK_COLORS = [
  { color:'#FFDC71', border:'#C8A800' }, { color:'#B7D354', border:'#7A9A20' },
  { color:'#76C662', border:'#3E8A30' }, { color:'#4D8A70', border:'#1E5040' },
  { color:'#538BB9', border:'#245A88' }, { color:'#58D1C6', border:'#1A8A80' },
  { color:'#55629B', border:'#1E3060' }, { color:'#56425B', border:'#2A1A30' },
  { color:'#814566', border:'#481A38' }, { color:'#9B70B8', border:'#5A2880' },
  { color:'#C45B63', border:'#7A2030' }, { color:'#EA8E77', border:'#A84830' },
  { color:'#C24B6E', border:'#7A1A3C' }, { color:'#355D68', border:'#102830' },
  { color:'#7FBAA4', border:'#3A7060' }, { color:'#EC9A6D', border:'#A85030' },
  { color:'#D9626B', border:'#8A2030' }, { color:'#FFC27A', border:'#B07020' },
  { color:'#FFEB99', border:'#C8A800' }, { color:'#A73169', border:'#601040' },
];
const bc = (i: number) => BLOCK_COLORS[i % BLOCK_COLORS.length];

// ─── Tetrominos (max 3 Zellen breit) ────────────────────────────────────
const TETROMINOS = [
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

// ─── Power‑Ups ──────────────────────────────────────────────────────────
interface PUDef {
  shape:number[][]; color:string; border:string; name:string; effect:string;
  glow:string; symbol:string; pulse:string; accent:string;
}
const POWERUPS: PUDef[] = [
  { shape:[[1,1,1]],         color:'#FF3A1A',border:'#991200',name:'BOMBE',   effect:'bomb',        glow:'#FF6040',symbol:'circle',  pulse:'flicker',accent:'#FFD0C0'},
  { shape:[[1,1],[1,1]],     color:'#1E3A6E',border:'#080E1F',name:'LASER',   effect:'laser',       glow:'#4080FF',symbol:'bolt',    pulse:'spin',   accent:'#80B0FF'},
  { shape:[[0,1,0],[1,1,1]], color:'#FFC27A',border:'#B07020',name:'3x',      effect:'scndBonus',   glow:'#FFD060',symbol:'star',    pulse:'breathe',accent:'#FFF0A0'},
  { shape:[[1,1,0],[0,1,1]], color:'#58D1C6',border:'#1A8A80',name:'FREEZE',  effect:'freeze',      glow:'#88EEFF',symbol:'diamond', pulse:'ripple', accent:'#CCFFFF'},
  { shape:[[1,0],[1,1],[0,1]],color:'#4D8A70',border:'#1E5040',name:'GRAVITY',effect:'gravity',     glow:'#76C662',symbol:'arc',     pulse:'bounce', accent:'#B7D354'},
  { shape:[[1,1],[1,1]],     color:'#FFDC71',border:'#C8A800',name:'2x',      effect:'doubleScore', glow:'#FFD700',symbol:'square',  pulse:'breathe',accent:'#FFFACC'},
  { shape:[[0,1,0],[1,1,1]], color:'#E5E0D8',border:'#C8C0B0',name:'SHIELD',  effect:'shield',      glow:'#FFFFFF',symbol:'ring',    pulse:'ripple', accent:'#538BB9'},
  { shape:[[1,1,1],[1,1,1]], color:'#C45B63',border:'#7A2030',name:'MEGA',    effect:'megaBomb',    glow:'#FF4060',symbol:'triangle',pulse:'flicker',accent:'#FFB0B8'},
  { shape:[[1,1,1]],         color:'#355D68',border:'#102830',name:'REWIND',  effect:'rewind',      glow:'#58D1C6',symbol:'dot',     pulse:'spin',   accent:'#A0EEFF'},
];

// ─── Typen ──────────────────────────────────────────────────────────────
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
interface LocalHS { name:string; score:number; date:string; }
interface Particle { x:number; y:number; vx:number; vy:number; life:number; color:string; size:number; }

// ─── Highscore (nur ein Eintrag lokal) ──────────────────────────────────
const LOCAL_KEY = 'scnd_drop_best';
function loadLocalHS(): LocalHS | null {
  if (typeof window === 'undefined') return null;
  try { return JSON.parse(localStorage.getItem(LOCAL_KEY) ?? 'null'); } catch { return null; }
}
function saveLocalHS(entry: LocalHS) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(entry));
}

// ─── Hilfsfunktionen (rotierende Gravitation) ──────────────────────────
const emptyBoard = (): (Cell|null)[][] =>
  Array.from({ length: H }, () => Array(W).fill(null));

function rotateCW(s: number[][]): number[][] {
  const r = s.length, c = s[0].length;
  return Array.from({ length: c }, (_, ci) => Array.from({ length: r }, (_, ri) => s[r-1-ri][ci]));
}

function gravDir(rot: 0 | 90 | 180 | 270): { dx: number; dy: number } {
  switch (rot) {
    case 0: return { dx: 0, dy: 1 };
    case 90: return { dx: 1, dy: 0 };
    case 180: return { dx: 0, dy: -1 };
    case 270: return { dx: -1, dy: 0 };
  }
}

function s2b(sdx: number, sdy: number, rot: 0 | 90 | 180 | 270): { dx: number; dy: number } {
  switch (rot) {
    case 0: return { dx: sdx, dy: sdy };
    case 90: return { dx: sdy, dy: -sdx };
    case 180: return { dx: -sdx, dy: -sdy };
    case 270: return { dx: -sdy, dy: sdx };
  }
}

// Anchor-Maske für rotierende Gravitation
function anchorMask(board: (Cell|null)[][]): boolean[][] {
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
      if (ny>=0 && ny<H && nx>=0 && nx<W && !vis[ny][nx] && board[ny][nx]) {
        vis[ny][nx] = true; q.push([ny,nx]);
      }
    }
  }
  return vis;
}

function stepGrav(board: (Cell|null)[][], rot: 0 | 90 | 180 | 270): { board: (Cell|null)[][]; moved: boolean } {
  const anch = anchorMask(board);
  const next = board.map(r => [...r]) as (Cell|null)[][];
  let moved = false;
  const { dx, dy } = gravDir(rot);
  const ys = dy===1 ? Array.from({length:H},(_,i)=>H-1-i) : dy===-1 ? Array.from({length:H},(_,i)=>i) : Array.from({length:H},(_,i)=>i);
  const xs = dx===1 ? Array.from({length:W},(_,i)=>W-1-i) : dx===-1 ? Array.from({length:W},(_,i)=>i) : Array.from({length:W},(_,i)=>i);
  for (const y of ys) for (const x of xs) {
    if (!next[y][x] || anch[y][x]) continue;
    const ny = y+dy, nx = x+dx;
    if (ny<0 || ny>=H || nx<0 || nx>=W || next[ny][nx]) continue;
    next[ny][nx] = next[y][x]; next[y][x] = null; moved = true;
  }
  return { board: next, moved };
}

function settle(board: (Cell|null)[][], rot: 0 | 90 | 180 | 270): (Cell|null)[][] {
  let cur = board;
  for (let i = 0; i < W+H; i++) {
    const { board: nxt, moved } = stepGrav(cur, rot);
    cur = nxt;
    if (!moved) break;
  }
  return cur;
}

// ─── Linien auflösen: zusammenhängende Läufe >=5 ────────────────────────
interface LineClear {
  cells: [number,number][];
  powerups: { x:number; y:number; effect:string; name:string }[];
}

function findLines(board: (Cell|null)[][]): LineClear {
  const toDeleteSet = new Set<string>();
  const powerupsTemp: { x:number; y:number; effect:string; name:string }[] = [];

  // Horizontal
  for (let y = 0; y < H; y++) {
    let run: [number,number][] = [];
    for (let x = 0; x <= W; x++) {
      if (x < W && board[y][x]) {
        run.push([y,x]);
      } else {
        if (run.length >= 5) {
          for (const [yy,xx] of run) {
            toDeleteSet.add(`${yy},${xx}`);
            const cell = board[yy][xx];
            if (cell?.isPowerUp && cell.effect) {
              powerupsTemp.push({ x:xx, y:yy, effect:cell.effect, name:cell.name || 'PU' });
            }
          }
        }
        run = [];
      }
    }
  }

  // Vertikal
  for (let x = 0; x < W; x++) {
    let run: [number,number][] = [];
    for (let y = 0; y <= H; y++) {
      if (y < H && board[y][x]) {
        run.push([y,x]);
      } else {
        if (run.length >= 5) {
          for (const [yy,xx] of run) {
            toDeleteSet.add(`${yy},${xx}`);
            const cell = board[yy][xx];
            if (cell?.isPowerUp && cell.effect) {
              powerupsTemp.push({ x:xx, y:yy, effect:cell.effect, name:cell.name || 'PU' });
            }
          }
        }
        run = [];
      }
    }
  }

  const cells: [number,number][] = Array.from(toDeleteSet).map(key => {
    const [y,x] = key.split(',').map(Number);
    return [y,x];
  });
  return { cells, powerups: powerupsTemp };
}

function clearLines(board: (Cell|null)[][], cs: number, burst: (x:number,y:number)=>void): { board: (Cell|null)[][]; cleared: number; powerups: { x:number; y:number; effect:string; name:string }[] } {
  const { cells, powerups } = findLines(board);
  if (cells.length === 0) return { board, cleared: 0, powerups: [] };
  const next = board.map(row => [...row]) as (Cell|null)[][];
  for (const [y,x] of cells) {
    if (next[y][x]) {
      burst(x*cs + cs/2, y*cs + cs/2);
      next[y][x] = null;
    }
  }
  return { board: next, cleared: cells.length, powerups };
}

// ─── Zellgröße dynamisch ────────────────────────────────────────────────
function calcCellSize(containerW: number, containerH: number): number {
  const byW = Math.floor((containerW - 4) / W);
  const byH = Math.floor((containerH - 4) / H);
  return Math.min(Math.max(8, Math.min(byW, byH)), 64);
}

// ─── Geschwindigkeit: linear 2200ms (L1) → 450ms (L100) ────────────────
function getFallMsForLevel(level: number): number {
  const lvl = Math.min(level, 100);
  const ms = 2200 - (lvl - 1) * (1750 / 99);
  return Math.round(ms);
}

// ─── Canvas-Symbole für Power‑Ups ───────────────────────────────────────
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

// ─── Dark Mode / Mobile erkennen ────────────────────────────────────────
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

// ─── Hauptkomponente ────────────────────────────────────────────────────
export function ScndDropGame() {
  const areaRef    = useRef<HTMLDivElement>(null);
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const isDark     = useIsDark();
  const isMobile   = useIsMobile();
  const isDarkRef  = useRef(isDark);
  const isMobRef   = useRef(isMobile);
  useEffect(() => { isDarkRef.current = isDark; }, [isDark]);
  useEffect(() => { isMobRef.current = isMobile; }, [isMobile]);

  // Spiellogik-Refs
  const boardRef    = useRef<(Cell|null)[][]>(emptyBoard());
  const pieceRef    = useRef<Piece|null>(null);
  const pxRef       = useRef(0);
  const pyRef       = useRef(0);
  const rotRef      = useRef<0 | 90 | 180 | 270>(0);
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
  const histRef     = useRef<any[]>([]);
  const csRef       = useRef(20);
  const rafRef      = useRef(0);
  const lastFallRef = useRef(0);
  const gravRaf     = useRef(0);
  const lastGravRef = useRef(0);
  const bpRef       = useRef(0);
  const bpLimRef    = useRef(Math.floor(Math.random()*5)+3);

  // UI-State
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
  const [best,      setBest]      = useState<LocalHS | null>(null);
  const [showName,  setShowName]  = useState(false);
  const [pname,     setPname]     = useState('');
  const [csize,     setCsize]     = useState({ w: 200, h: 200 });

  useEffect(() => { setBest(loadLocalHS()); }, []);

  // ── Adaptive Zellgröße ─────────────────────────────────────────────────
  const recalc = useCallback(() => {
    if (!areaRef.current) return;
    const r = areaRef.current.getBoundingClientRect();
    const cs = calcCellSize(r.width, r.height);
    csRef.current = cs;
    setCsize({ w: W * cs, h: H * cs });
  }, []);

  useEffect(() => {
    recalc();
    const ro = new ResizeObserver(recalc);
    if (areaRef.current) ro.observe(areaRef.current);
    return () => ro.disconnect();
  }, [recalc]);

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

  // Kollision (für fallendes Stück)
  const hits = useCallback((shape: number[][], ox: number, oy: number): boolean => {
    for (let y = 0; y < shape.length; y++) {
      for (let x = 0; x < shape[y].length; x++) {
        if (!shape[y][x]) continue;
        const bx = ox + x;
        const by = oy + y;
        if (bx < 0 || bx >= W || by < 0 || by >= H) return true;
        if (boardRef.current[by][bx]) return true;
      }
    }
    return false;
  }, []);

  // Ghost-Position (wo das Stück landen würde) – basierend auf aktueller Gravitationsrichtung
  const ghostPos = useCallback(() => {
    const p = pieceRef.current;
    if (!p) return { x: pxRef.current, y: pyRef.current };
    const { dx, dy } = gravDir(rotRef.current);
    let gx = pxRef.current, gy = pyRef.current;
    while (!hits(p.shape, gx+dx, gy+dy)) { gx += dx; gy += dy; }
    return { x: gx, y: gy };
  }, [hits]);

  // Spawn neues Stück
  const spawn = useCallback((): boolean => {
    const isPU = Math.random() < 0.14;
    const pool = isPU ? POWERUPS : TETROMINOS;
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
    const pw = piece.shape[0].length;
    const cx = Math.floor((W - pw) / 2);
    const cy = 0;
    if (!hits(piece.shape, cx, cy)) {
      pieceRef.current = piece;
      pxRef.current = cx;
      pyRef.current = cy;
      return true;
    }
    return false;
  }, [hits]);

  // Power‑Up auslösen (wird nur beim Linienlöschen aufgerufen)
  const triggerPU = useCallback((effect: string, x: number, y: number, name: string) => {
    setPuName(name); showBonus(`${name} AKTIVIERT`);
    const cs = csRef.current;
    burst(x*cs+cs/2, y*cs+cs/2, 30);
    let b = boardRef.current.map(row => [...row]) as (Cell|null)[][];
    switch (effect) {
      case 'bomb':
        for (let dy=-2;dy<=2;dy++) for (let dx=-2;dx<=2;dx++) {
          const nx = x+dx, ny = y+dy;
          if (nx>=0 && nx<W && ny>=0 && ny<H && b[ny][nx]) {
            burst(nx*cs+cs/2, ny*cs+cs/2, 4);
            b[ny][nx] = null;
          }
        }
        boardRef.current = settle(b, rotRef.current);
        break;
      case 'laser':
        for (let xi=0;xi<W;xi++) if (b[y][xi]) { burst(xi*cs+cs/2, y*cs+cs/2, 4); b[y][xi]=null; }
        boardRef.current = settle(b, rotRef.current);
        break;
      case 'scndBonus': scndRef.current=true; updFlags(); setTimeout(()=>{scndRef.current=false;updFlags();},30000); break;
      case 'freeze':    freezeRef.current=true; updFlags(); setTimeout(()=>{freezeRef.current=false;updFlags();},3000); break;
      case 'gravity':   boardRef.current = settle(b, rotRef.current); break;
      case 'swap': {
        const blocks:{y:number;x:number}[]=[];
        for (let i=0;i<H;i++) for (let j=0;j<W;j++) if(b[i][j]) blocks.push({y:i,x:j});
        if (blocks.length>=2) {
          let a=Math.floor(Math.random()*blocks.length), bix=Math.floor(Math.random()*blocks.length);
          while(bix===a) bix=Math.floor(Math.random()*blocks.length);
          const p1=blocks[a], p2=blocks[bix];
          [b[p1.y][p1.x], b[p2.y][p2.x]] = [b[p2.y][p2.x], b[p1.y][p1.x]];
          boardRef.current = b;
        }
        break;
      }
      case 'clearLine': {
        const row = Math.floor(Math.random()*H);
        for (let xi=0;xi<W;xi++) if(b[row][xi]) { burst(xi*cs+cs/2, row*cs+cs/2, 4); b[row][xi]=null; }
        boardRef.current = settle(b, rotRef.current);
        break;
      }
      case 'doubleScore': doubleRef.current=true; updFlags(); setTimeout(()=>{doubleRef.current=false;updFlags();},10000); break;
      case 'shield':      shieldRef.current=true; updFlags(); setTimeout(()=>{shieldRef.current=false;updFlags();},10000); break;
      case 'megaBomb':
        for (let dy=-3;dy<=3;dy++) for (let dx=-3;dx<=3;dx++) {
          const nx=x+dx, ny=y+dy;
          if (nx>=0 && nx<W && ny>=0 && ny<H && b[ny][nx]) { burst(nx*cs+cs/2, ny*cs+cs/2, 6); b[ny][nx]=null; }
        }
        boardRef.current = settle(b, rotRef.current);
        break;
      case 'meteor': {
        const col = Math.floor(Math.random()*W);
        for (let yi=0;yi<H;yi++) if(b[yi][col]) { burst(col*cs+cs/2, yi*cs+cs/2, 4); b[yi][col]=null; }
        boardRef.current = settle(b, rotRef.current);
        break;
      }
      case 'rewind':
        if (histRef.current.length > 0) {
          const last = histRef.current.pop();
          if (last) {
            boardRef.current = last.board;
            scoreRef.current = last.score;
            linesRef.current = last.lines;
            levelRef.current = last.level;
            comboRef.current = last.combo;
            setUiScore(scoreRef.current);
            setUiLines(linesRef.current);
            setUiLevel(levelRef.current);
            setUiCombo(comboRef.current);
            showBonus('ZEITREISE!');
          }
        }
        break;
      default: break;
    }
    setTimeout(() => setPuName(''), 2500);
  }, [burst, showBonus, updFlags]);

  // Stück festsetzen und Linien auflösen
  const merge = useCallback(() => {
    const p = pieceRef.current;
    if (!p) return;

    // Zustand für Undo speichern
    histRef.current.push({
      board: boardRef.current.map(r => [...r]),
      score: scoreRef.current,
      lines: linesRef.current,
      level: levelRef.current,
      combo: comboRef.current,
    });
    if (histRef.current.length > 5) histRef.current.shift();

    // Block ins Board einfügen
    let nb = boardRef.current.map(row => [...row]) as (Cell|null)[][];
    for (let y=0; y<p.shape.length; y++) {
      for (let x=0; x<p.shape[y].length; x++) {
        if (!p.shape[y][x]) continue;
        const bx = pxRef.current + x;
        const by = pyRef.current + y;
        if (bx>=0 && bx<W && by>=0 && by<H) {
          nb[by][bx] = {
            color: p.color, border: p.border, isPowerUp: p.isPowerUp,
            effect: p.effect, glow: p.glow, symbol: p.symbol, pulse: p.pulse, accent: p.accent,
            isIce: !p.isPowerUp && Math.random()<0.05,
            isGold: !p.isPowerUp && Math.random()<0.04,
          };
        }
      }
    }

    // Linien suchen & löschen (Power‑Up Effekte werden gesammelt)
    const cs = csRef.current;
    const { board: afterClear, cleared, powerups } = clearLines(nb, cs, burst);
    let finalBoard = settle(afterClear, rotRef.current);
    boardRef.current = finalBoard;

    // Punkte berechnen
    let added = 0;
    if (cleared > 0) {
      const base = [0,400,1000,3000,12000];
      comboRef.current += 1;
      let mult = 1 + comboRef.current * 0.3;
      if (scndRef.current) mult *= 3;
      if (doubleRef.current) mult *= 2;
      added = Math.floor(base[Math.min(cleared,4)] * mult);
    } else {
      comboRef.current = 0;
    }
    scoreRef.current += added;
    linesRef.current += cleared;
    levelRef.current = Math.floor(linesRef.current / 8) + 1;
    setUiScore(scoreRef.current);
    setUiLines(linesRef.current);
    setUiLevel(levelRef.current);
    setUiCombo(comboRef.current);

    // Power‑Ups auslösen (jetzt erst, nachdem sie gelöscht wurden)
    for (const pu of powerups) {
      triggerPU(pu.effect, pu.x, pu.y, pu.name);
    }

    // Zufällige Rotation des Spielfelds (visuell und Gravitation)
    bpRef.current++;
    if (bpRef.current >= bpLimRef.current) {
      bpRef.current = 0;
      bpLimRef.current = Math.floor(Math.random()*5)+3;
      const rots: (0|90|180|270)[] = [0,90,180,270];
      let next = rots[Math.floor(Math.random()*4)];
      while (next === rotRef.current) next = rots[Math.floor(Math.random()*4)];
      rotRef.current = next;
      if (canvasRef.current) {
        canvasRef.current.style.transform = `rotate(${next}deg)`;
        canvasRef.current.style.transition = 'transform 0.4s cubic-bezier(0.2,0.9,0.4,1.1)';
      }
      if (typeof window !== 'undefined' && window.navigator.vibrate) window.navigator.vibrate(80);
    }

    // Neues Stück spawnen
    if (!spawn()) endGame();
  }, [burst, spawn, triggerPU]);

  // Bewegung des aktuellen Stücks – berücksichtigt Rotation
  const move = useCallback((sdx: number, sdy: number) => {
    const p = pieceRef.current;
    if (!p || !playRef.current || pauseRef.current || goRef.current || freezeRef.current) return;
    const { dx, dy } = s2b(sdx, sdy, rotRef.current);
    const nx = pxRef.current + dx;
    const ny = pyRef.current + dy;
    if (!hits(p.shape, nx, ny)) {
      pxRef.current = nx;
      pyRef.current = ny;
    } else if (sdy === 1) { // Fallbewegung – dann mergen
      merge();
    }
  }, [hits, merge]);

  const rotPiece = useCallback(() => {
    const p = pieceRef.current;
    if (!p || !playRef.current || pauseRef.current || goRef.current || freezeRef.current) return;
    const rotated = rotateCW(p.shape);
    if (!hits(rotated, pxRef.current, pyRef.current)) {
      pieceRef.current = { ...p, shape: rotated };
    }
  }, [hits]);

  const endGame = useCallback(() => {
    playRef.current = false;
    goRef.current = true;
    cancelAnimationFrame(rafRef.current);
    cancelAnimationFrame(gravRaf.current);
    setPlaying(false);
    setGameOver(true);
    setFinalSc(scoreRef.current);
    if (scoreRef.current > 0) setShowName(true);
  }, []);

  const getFallMs = useCallback((): number => {
    if (freezeRef.current) return Infinity;
    let ms = getFallMsForLevel(levelRef.current);
    if (slowRef.current) ms *= 2;
    if (fastRef.current) ms /= 2;
    return ms;
  }, []);

  // ─── Zeichnen (inkl. Ghost) ──────────────────────────────────────────
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const cs = csRef.current;
    const cw = W*cs, ch = H*cs;
    canvas.width = cw; canvas.height = ch;
    const t = pulseRef.current;
    const T = getTheme(isDarkRef.current);

    ctx.fillStyle = T.canvasBg;
    ctx.fillRect(0, 0, cw, ch);
    ctx.strokeStyle = T.gridLine;
    ctx.lineWidth = 1;
    for (let x=0; x<=W; x++) { ctx.beginPath(); ctx.moveTo(x*cs,0); ctx.lineTo(x*cs,ch); ctx.stroke(); }
    for (let y=0; y<=H; y++) { ctx.beginPath(); ctx.moveTo(0,y*cs); ctx.lineTo(cw,y*cs); ctx.stroke(); }
    ctx.strokeStyle = BRAND;
    ctx.lineWidth = 2;
    ctx.strokeRect(1,1,cw-2,ch-2);

    const board = boardRef.current;
    for (let y=0; y<H; y++) {
      for (let x=0; x<W; x++) {
        const cell = board[y][x];
        if (!cell) continue;
        const cx = x*cs, cy = y*cs;
        if (cell.isPowerUp && cell.glow) {
          ctx.shadowBlur = 6+5*Math.sin(t*1.5);
          ctx.shadowColor = cell.glow;
        }
        ctx.fillStyle = cell.color;
        ctx.fillRect(cx, cy, cs-1, cs-1);
        ctx.fillStyle = cell.border;
        ctx.fillRect(cx, cy, cs-1, 2);
        ctx.fillRect(cx, cy, 2, cs-1);
        ctx.fillStyle = 'rgba(0,0,0,0.22)';
        ctx.fillRect(cx, cy+cs-3, cs-1, 2);
        ctx.fillRect(cx+cs-3, cy, 2, cs-1);
        ctx.shadowBlur = 0;
        if (cell.isIce) {
          ctx.fillStyle = 'rgba(88,209,198,0.28)';
          ctx.fillRect(cx, cy, cs-1, cs-1);
          ctx.fillStyle = 'rgba(255,255,255,0.5)';
          ctx.fillRect(cx+cs*0.2, cy+cs*0.2, 2, 2);
        }
        if (cell.isGold) {
          const gs = 0.25+0.2*Math.sin(t*2+x*0.7+y*0.5);
          ctx.fillStyle = `rgba(255,220,60,${gs})`;
          ctx.fillRect(cx, cy, cs-1, cs-1);
        }
        if (cell.isPowerUp && cell.symbol && cell.accent && cs>=10) {
          const scl = cell.pulse==='breathe' ? 0.75+0.25*Math.sin(t*2) : cell.pulse==='flicker' ? (Math.random()>0.12?1:0.5) : 1;
          const ang = cell.pulse==='spin' ? t*1.5 : cell.pulse==='bounce' ? Math.sin(t*3)*0.3 : 0;
          ctx.save(); ctx.translate(cx+cs/2, cy+cs/2); ctx.rotate(ang); ctx.scale(scl,scl); ctx.translate(-(cx+cs/2), -(cy+cs/2));
          drawSym(ctx, cell.symbol, cx+cs/2, cy+cs/2, cs, cell.accent, t);
          ctx.restore();
        }
      }
    }

    // Fallendes Stück + Ghost
    const p = pieceRef.current;
    if (p && !goRef.current && !freezeRef.current && !pauseRef.current) {
      const ghost = ghostPos();
      ctx.globalAlpha = isDarkRef.current ? 0.16 : 0.20;
      for (let y=0; y<p.shape.length; y++) {
        for (let x=0; x<p.shape[y].length; x++) {
          if (!p.shape[y][x]) continue;
          const bx = ghost.x + x;
          const by = ghost.y + y;
          if (bx>=0 && bx<W && by>=0 && by<H) {
            ctx.fillStyle = p.color;
            ctx.fillRect(bx*cs, by*cs, cs-1, cs-1);
          }
        }
      }
      ctx.globalAlpha = 1;
      ctx.shadowBlur = p.isPowerUp ? (10+6*Math.sin(t*2)) : (5+3*Math.sin(t));
      ctx.shadowColor = p.glow ?? BRAND;
      ctx.shadowOffsetY = 2;
      for (let y=0; y<p.shape.length; y++) {
        for (let x=0; x<p.shape[y].length; x++) {
          if (!p.shape[y][x]) continue;
          const bx = pxRef.current + x;
          const by = pyRef.current + y;
          if (bx>=0 && bx<W && by>=0 && by<H) {
            ctx.fillStyle = p.color;
            ctx.fillRect(bx*cs, by*cs, cs-1, cs-1);
            ctx.fillStyle = p.border;
            ctx.fillRect(bx*cs, by*cs, cs-1, 2);
            ctx.fillRect(bx*cs, by*cs, 2, cs-1);
            ctx.fillStyle = 'rgba(0,0,0,0.22)';
            ctx.fillRect(bx*cs, by*cs+cs-3, cs-1, 2);
            ctx.fillRect(bx*cs+cs-3, by*cs, 2, cs-1);
          }
        }
      }
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;
      if (p.isPowerUp && p.symbol && p.accent && cs>=10) {
        for (let y=0; y<p.shape.length; y++) {
          for (let x=0; x<p.shape[y].length; x++) {
            if (!p.shape[y][x]) continue;
            const bx = pxRef.current + x;
            const by = pyRef.current + y;
            if (bx>=0 && bx<W && by>=0 && by<H) {
              const scl = p.pulse==='breathe' ? 0.75+0.25*Math.sin(t*2) : 1;
              const ang = p.pulse==='spin' ? t*1.5 : p.pulse==='bounce' ? Math.sin(t*3)*0.3 : 0;
              ctx.save(); ctx.translate(bx*cs+cs/2, by*cs+cs/2); ctx.rotate(ang); ctx.scale(scl,scl); ctx.translate(-(bx*cs+cs/2), -(by*cs+cs/2));
              drawSym(ctx, p.symbol, bx*cs+cs/2, by*cs+cs/2, cs, p.accent, t);
              ctx.restore();
            }
          }
        }
      }
    }

    // Partikel
    partsRef.current = partsRef.current.filter(pt => pt.life > 0);
    for (const pt of partsRef.current) {
      ctx.globalAlpha = pt.life;
      ctx.fillStyle = pt.color;
      ctx.fillRect(pt.x-pt.size/2, pt.y-pt.size/2, pt.size, pt.size);
      pt.x += pt.vx;
      pt.y += pt.vy;
      pt.vy += 0.1;
      pt.life -= 0.04;
    }
    ctx.globalAlpha = 1;
  }, [ghostPos]);

  // ─── Spielschleifen ───────────────────────────────────────────────────
  const gameLoop = useCallback((now: number) => {
    if (!playRef.current || goRef.current || pauseRef.current) return;
    pulseRef.current = now * 0.008;
    const delay = getFallMs();
    if (delay !== Infinity && now - lastFallRef.current >= delay) {
      move(0, 1);
      lastFallRef.current = now;
    }
    draw();
    rafRef.current = requestAnimationFrame(gameLoop);
  }, [getFallMs, move, draw]);

  // Zusätzliche Gravitationsschleife für das Board (rotierende Schwerkraft)
  const gravLoop = useCallback((now: number) => {
    if (!playRef.current || goRef.current || pauseRef.current || freezeRef.current) {
      gravRaf.current = requestAnimationFrame(gravLoop);
      return;
    }
    if (now - lastGravRef.current >= 150) {
      const { board: afterGrav, moved } = stepGrav(boardRef.current, rotRef.current);
      if (moved) {
        boardRef.current = afterGrav;
        // Nach jeder Bewegung prüfen, ob neue Linien entstanden sind
        const cs = csRef.current;
        const { board: afterClear, cleared, powerups } = clearLines(boardRef.current, cs, burst);
        if (cleared > 0) {
          boardRef.current = settle(afterClear, rotRef.current);
          // Punkte für automatisch aufgelöste Linien
          let add = cleared * 50;
          if (doubleRef.current) add *= 2;
          scoreRef.current += add;
          setUiScore(scoreRef.current);
          for (const pu of powerups) triggerPU(pu.effect, pu.x, pu.y, pu.name);
        }
      }
      lastGravRef.current = now;
    }
    gravRaf.current = requestAnimationFrame(gravLoop);
  }, [burst, triggerPU]);

  // ─── Spiel starten ────────────────────────────────────────────────────
  const startGame = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    cancelAnimationFrame(gravRaf.current);

    let newBoard = emptyBoard();
    // Optional: Fester Block in der Mitte – auskommentiert, kann bei Bedarf aktiviert werden
    // newBoard[7][7] = { color: '#888', border: '#444', isPowerUp: false };
    boardRef.current = newBoard;

    scoreRef.current = 0;
    levelRef.current = 1;
    linesRef.current = 0;
    comboRef.current = 0;
    pieceRef.current = null;
    freezeRef.current = false;
    slowRef.current = false;
    fastRef.current = false;
    shieldRef.current = false;
    doubleRef.current = false;
    scndRef.current = false;
    partsRef.current = [];
    histRef.current = [];
    bpRef.current = 0;
    bpLimRef.current = Math.floor(Math.random()*5)+3;
    goRef.current = false;
    pauseRef.current = false;
    playRef.current = true;
    rotRef.current = 0;
    if (canvasRef.current) canvasRef.current.style.transform = 'rotate(0deg)';

    setUiScore(0);
    setUiLevel(1);
    setUiLines(0);
    setUiCombo(0);
    setGameOver(false);
    setPaused(false);
    setPuName('');
    setBonus('');
    setShowName(false);
    updFlags();
    recalc();

    if (!spawn()) {
      endGame();
      return;
    }
    setPlaying(true);
    const now = performance.now();
    lastFallRef.current = now;
    lastGravRef.current = now;
    rafRef.current = requestAnimationFrame(gameLoop);
    gravRaf.current = requestAnimationFrame(gravLoop);
  }, [spawn, gameLoop, gravLoop, updFlags, recalc, endGame]);

  const togglePause = useCallback(() => {
    if (!playRef.current || goRef.current) return;
    pauseRef.current = !pauseRef.current;
    setPaused(pauseRef.current);
    if (!pauseRef.current) {
      const now = performance.now();
      lastFallRef.current = now;
      lastGravRef.current = now;
      rafRef.current = requestAnimationFrame(gameLoop);
      gravRaf.current = requestAnimationFrame(gravLoop);
    } else {
      cancelAnimationFrame(rafRef.current);
      draw();
    }
  }, [gameLoop, gravLoop, draw]);

  const giveUp = useCallback(() => {
    if (playRef.current && !goRef.current) endGame();
  }, [endGame]);

  // Tastatursteuerung
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!playRef.current) return;
      switch (e.key) {
        case 'ArrowLeft':  e.preventDefault(); move(-1,0); break;
        case 'ArrowRight': e.preventDefault(); move(1,0);  break;
        case 'ArrowDown':  e.preventDefault(); move(0,1);  break;
        case 'ArrowUp':    e.preventDefault(); rotPiece(); break;
        case 'Escape':     e.preventDefault(); togglePause(); break;
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [move, rotPiece, togglePause]);

  const saveHS = () => {
    if (!pname.trim()) return;
    const entry: LocalHS = { name: pname.trim(), score: finalSc, date: new Date().toLocaleDateString('de-DE') };
    saveLocalHS(entry);
    setBest(entry);
    setShowName(false);
    setPname('');
  };

  // ─── Rendern ──────────────────────────────────────────────────────────
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
  const mbSize = isMobile ? Math.min(Math.max(52, Math.floor(window?.innerWidth ? (window.innerWidth - 80) / 6 : 52)), 80) : 52;

  return (
    <div style={{ background: T.wrapperBg, borderColor: `${BRAND}35` }}
      className="w-full h-screen md:h-auto md:min-h-[600px] md:my-4 rounded-2xl border-2 flex flex-col overflow-hidden transition-colors duration-300">
      <div style={{ background: `linear-gradient(90deg,${BRAND_DIM},${BRAND},${BRAND_DIM})` }} className="h-0.5 flex-shrink-0" />
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
        {(bonus || puName) && (
          <div className="mt-0.5 animate-bounce">
            <span style={{ color:BRAND, borderColor:`${BRAND}40` }}
              className="inline-block px-2 py-0.5 text-[8px] font-bold tracking-wider border rounded-sm">{puName || bonus}</span>
          </div>
        )}
      </div>

      <div className="flex-1 flex flex-col md:flex-row gap-2 px-2 pb-1 min-h-0">
        <div ref={areaRef} className="flex-1 min-h-0 flex items-center justify-center relative">
          <div className="relative" style={{ width:csize.w, height:csize.h }}>
            <div className="absolute -inset-1 rounded pointer-events-none" style={{ boxShadow:`0 0 24px 2px ${BRAND}22` }} />
            <canvas ref={canvasRef}
              style={{
                display:'block', width:csize.w, height:csize.h,
                transform:`rotate(${rotRef.current}deg)`,
                transition:'transform 0.4s cubic-bezier(0.2,0.9,0.4,1.1)',
                imageRendering:'pixelated',
                border:`2px solid ${BRAND}`, borderRadius:3,
              }}
            />
            {paused && !gameOver && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded" style={{ background:overlayBg, backdropFilter:'blur(6px)' }}>
                <div style={{ color:BRAND }} className="text-base font-black tracking-[0.3em]">PAUSE</div>
                <OBtn label="WEITER" onClick={togglePause} bg={BRAND} fg={T.canvasBg} />
                <OBtn label="NEUSTART" onClick={startGame} outline={BRAND} fg={BRAND} />
                <OBtn label="AUFGEBEN" onClick={giveUp} outline="#C45B63" fg="#C45B63" />
              </div>
            )}
            {!playing && !gameOver && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded" style={{ background:overlayBg, backdropFilter:'blur(4px)' }}>
                <div style={{ color:BRAND, letterSpacing:'0.2em' }} className="text-xl font-black">SCND DROP</div>
                <div style={{ color:T.textMuted }} className="text-[9px] text-center px-4">15×15 · Ketten ab 5 · Rotierende Gravitation</div>
                <OBtn label="START" onClick={startGame} bg={BRAND} fg={T.canvasBg} />
              </div>
            )}
            {gameOver && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded" style={{ background:overlayBg, backdropFilter:'blur(6px)' }}>
                <div className="font-black text-base tracking-wider"><span style={{ color:BRAND }}>GAME</span><span style={{ color:T.textPrimary }}> OVER</span></div>
                <div style={{ color:BRAND }} className="text-2xl font-black tabular-nums">{finalSc.toLocaleString()}</div>
                <OBtn label="NEUSTART" onClick={startGame} bg={BRAND} fg={T.canvasBg} />
              </div>
            )}
          </div>
        </div>

        <div className="flex-shrink-0 flex flex-row md:flex-col gap-2 md:w-40 pb-1">
          <div className="flex-1 md:flex-none rounded p-2" style={panelStyle}>
            <div style={{ color:T.textMuted }} className="text-[6px] uppercase tracking-widest text-center mb-0.5">PUNKTE</div>
            <div style={{ color:BRAND }} className="text-xl font-black tabular-nums text-center leading-none">
              {(gameOver ? finalSc : uiScore).toLocaleString()}
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

          <div className="flex-1 md:flex-none rounded p-2" style={panelStyle}>
            <div style={{ color:BRAND }} className="text-[6px] font-bold uppercase tracking-widest mb-1 text-center">BESTE</div>
            {best ? (
              <div>
                <div className="flex justify-between items-center">
                  <span style={{ color:T.textPrimary }} className="text-[8px] font-bold truncate">{best.name}</span>
                  <span style={{ color:BRAND }} className="text-[9px] font-black tabular-nums">{best.score.toLocaleString()}</span>
                </div>
                <div style={{ color:T.textMuted }} className="text-[5px] text-right">{best.date}</div>
              </div>
            ) : (
              <div style={{ color:T.textMuted }} className="text-[7px] italic text-center">— kein Eintrag —</div>
            )}
          </div>

          <div className="hidden md:block rounded p-2" style={panelStyle}>
            <div style={{ color:T.textMuted }} className="text-[5px] uppercase tracking-widest mb-1">Steuerung</div>
            {([['←→','Seite'],['↓','Fall'],['↑','Dreh'],['ESC','Pause']] as [string,string][]).map(([k,v]) => (
              <div key={k} className="flex justify-between items-center mb-0.5">
                <kbd style={{ borderColor:`${BRAND}40`, color:BRAND, background:T.canvasBg }} className="px-1 py-0.5 text-[6px] font-mono border rounded">{k}</kbd>
                <span style={{ color:T.textMuted }} className="text-[6px]">{v}</span>
              </div>
            ))}
          </div>
          {playing && !gameOver && (
            <button onClick={giveUp} style={{ borderColor:'#C45B6355', color:'#C45B63AA' }} className="hidden md:block rounded py-0.5 text-[7px] font-bold uppercase tracking-widest border hover:opacity-80 transition">Aufgeben</button>
          )}
        </div>
      </div>

      {playing && !gameOver && !paused && (
        <div style={{ background: T.panelBg, borderTopColor: T.panelBorder }} className="md:hidden flex-shrink-0 border-t py-3 px-4">
          <div className="flex items-center justify-between w-full max-w-sm mx-auto">
            <div className="flex flex-col items-center gap-1.5">
              <MB label="↑" fn={rotPiece} size={mbSize} col={BRAND} bg={T.panelBg} />
              <div className="flex gap-1.5">
                <MB label="◀" fn={() => move(-1,0)} size={mbSize} col={BRAND} bg={T.panelBg} />
                <MB label="▼" fn={() => move(0,1)}  size={mbSize} col={BRAND} bg={T.panelBg} />
                <MB label="▶" fn={() => move(1,0)}  size={mbSize} col={BRAND} bg={T.panelBg} />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <MB label="ROT" fn={rotPiece}    size={mbSize} col={BRAND} bg={BRAND} filled />
              <MB label="⏸"  fn={togglePause} size={mbSize} col={T.textMuted} bg={T.panelBg} />
            </div>
          </div>
          <div className="flex justify-center mt-2 gap-3">
            <span style={{ color:T.textMuted }} className="text-[7px] uppercase tracking-widest">
              LVL {uiLevel} · {Math.round(getFallMsForLevel(uiLevel)/100)/10}s/Fall
            </span>
          </div>
        </div>
      )}

      {showName && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ background: overlayBg, backdropFilter:'blur(8px)' }}>
          <div className="rounded-xl p-5 max-w-sm w-full shadow-2xl" style={{ background: T.panelBg, border:`2px solid ${BRAND}` }}>
            <h3 style={{ color:BRAND }} className="text-base font-black tracking-wider mb-0.5">NEUE BESTLEISTUNG</h3>
            <p style={{ color:T.textMuted }} className="text-[10px] mb-1">Wird nur lokal gespeichert</p>
            <p style={{ color:T.textMuted }} className="text-xs mb-3">
              Punktzahl: <span style={{ color:BRAND }} className="font-black text-base">{finalSc.toLocaleString()}</span>
            </p>
            <input type="text" value={pname} onChange={e => setPname(e.target.value)} onKeyDown={e => e.key==='Enter' && saveHS()}
              maxLength={15} autoFocus placeholder="DEIN NAME"
              style={{ background:T.canvasBg, borderColor:`${BRAND}70`, color:T.textPrimary, outline:'none' }}
              className="w-full p-2.5 border rounded mb-3 text-xs uppercase tracking-wider"
            />
            <div className="flex gap-2">
              <button onClick={saveHS} style={{ background:BRAND, color:T.canvasBg }} className="flex-1 py-1.5 font-black text-xs uppercase tracking-wider rounded hover:opacity-90 transition">SPEICHERN</button>
              <button onClick={() => setShowName(false)} style={{ borderColor:`${T.textMuted}50`, color:T.textMuted }} className="flex-1 py-1.5 font-bold text-xs uppercase tracking-wider rounded border hover:opacity-80 transition">SKIP</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── UI-Helfer ──────────────────────────────────────────────────────────
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
