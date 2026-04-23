'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

// ─── Brand ────────────────────────────────────────────────────────────────────
const BRAND = '#FF4400';
const BRAND_DIM = '#CC3300';
type Rot = 0 | 90 | 180 | 270;

// ─── Board: fixed 15×15 ───────────────────────────────────────────────────────
const BW = 15, BH = 15;
const CLEAR_MIN = 10;

// ─── Game over condition: central 3x3 area max 50% filled ────────────────────
const CRITICAL_ZONE_SIZE = 3;
const CRITICAL_ZONE_MAX_FILL = 0.5;

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

// ─── Tetrominos ───────────────────────────────────────────────────────────────
const TETROMINOS = [
  { shape:[[1,1,1]],          ...bc(0),  name:'I3'   },
  { shape:[[1,1],[1,1]],      ...bc(1),  name:'O'    },
  { shape:[[0,1,0],[1,1,1]],  ...bc(2),  name:'T'    },
  { shape:[[1,1,1],[0,1,0]],  ...bc(3),  name:'T2'   },
  { shape:[[1,1,0],[0,1,1]],  ...bc(4),  name:'S'    },
  { shape:[[0,1,1],[1,1,0]],  ...bc(5),  name:'Z'    },
  { shape:[[1,0],[1,0],[1,1]],...bc(6),  name:'L'    },
  { shape:[[0,1],[0,1],[1,1]],...bc(7),  name:'J'    },
  { shape:[[1,1],[1,0],[1,0]],...bc(8),  name:'L2'   },
  { shape:[[1,1],[0,1],[0,1]],...bc(9),  name:'J2'   },
  { shape:[[1,0,1],[0,1,0]],  ...bc(10), name:'Y'    },
  { shape:[[0,1,0],[1,1,1]],  ...bc(11), name:'T3'   },
  { shape:[[1,1,1],[1,0,0]],  ...bc(12), name:'L3'   },
  { shape:[[1,1,1],[0,0,1]],  ...bc(13), name:'J3'   },
];

// ─── Power-up definitions ─────────────────────────────────────────────────────
interface PUDef {
  shape:number[][];color:string;border:string;name:string;effect:string;
  glow:string;symbol:string;pulse:string;accent:string;desc:string;
}
const POWERUPS: PUDef[] = [
  { shape:[[1,1,1]], color:'#FF3A1A',border:'#991200',name:'BOMBE',
    effect:'bomb',       glow:'#FF6040',symbol:'circle',  pulse:'flicker',accent:'#FFD0C0',
    desc:'Löscht 3×3 Bereich' },
  { shape:[[1,1],[1,0]], color:'#1E3A6E',border:'#080E1F',name:'LASER',
    effect:'laser',      glow:'#4080FF',symbol:'bolt',    pulse:'spin',   accent:'#80B0FF',
    desc:'Löscht Reihe + Spalte' },
  { shape:[[0,1,0],[1,1,1]], color:'#FFC27A',border:'#B07020',name:'3×',
    effect:'scndBonus',  glow:'#FFD060',symbol:'star',    pulse:'breathe',accent:'#FFF0A0',
    desc:'3× Punkte für 20s' },
  { shape:[[1,1,0],[0,1,1]], color:'#58D1C6',border:'#1A8A80',name:'FREEZE',
    effect:'freeze',     glow:'#88EEFF',symbol:'diamond', pulse:'ripple', accent:'#CCFFFF',
    desc:'Stoppt Zeit für 4s' },
  { shape:[[1,0],[1,1],[0,1]], color:'#4D8A70',border:'#1E5040',name:'GRAV',
    effect:'gravity',    glow:'#76C662',symbol:'arc',     pulse:'bounce', accent:'#B7D354',
    desc:'Lose Blöcke fallen' },
  { shape:[[1,1,1],[1,0,0]], color:'#9B70B8',border:'#5A2880',name:'CLEAR',
    effect:'clearColor', glow:'#C080FF',symbol:'wave',    pulse:'flicker',accent:'#E8D0FF',
    desc:'Löscht häufigste Farbe' },
  { shape:[[1,1],[1,1]], color:'#FFDC71',border:'#C8A800',name:'2×',
    effect:'doubleScore',glow:'#FFD700',symbol:'square',  pulse:'breathe',accent:'#FFFACC',
    desc:'2× Punkte für 15s' },
  { shape:[[0,1,0],[1,1,1],[0,1,0]], color:'#E5E0D8',border:'#C8C0B0',name:'SHIELD',
    effect:'shield',     glow:'#FFFFFF',symbol:'ring',    pulse:'ripple', accent:'#538BB9',
    desc:'Schutz vor Game-Over' },
  { shape:[[1,1,1],[1,1,1]], color:'#C45B63',border:'#7A2030',name:'MEGA',
    effect:'megaBomb',   glow:'#FF4060',symbol:'triangle',pulse:'flicker',accent:'#FFB0B8',
    desc:'Löscht 5×5 Bereich' },
  { shape:[[0,1,0],[1,1,1]], color:'#EA8E77',border:'#A84830',name:'METEOR',
    effect:'meteor',     glow:'#FF8C00',symbol:'spark',   pulse:'bounce', accent:'#FFD0A0',
    desc:'Löscht 3 Spalten' },
  { shape:[[1,1,1],[1,0,1]], color:'#355D68',border:'#102830',name:'REWIND',
    effect:'rewind',     glow:'#58D1C6',symbol:'dot',     pulse:'spin',   accent:'#A0EEFF',
    desc:'Zeitreise: 3 Züge zurück' },
  { shape:[[1,0],[1,1]], color:'#814566',border:'#481A38',name:'SWAP',
    effect:'swap',       glow:'#C080A0',symbol:'cross',   pulse:'spin',   accent:'#F0C0D8',
    desc:'Tauscht 2 Farben' },
];

// ─── Power-up Animation System ────────────────────────────────────────────────
interface PUAnim {
  effect: string;
  px: number;  // grid x of trigger
  py: number;  // grid y of trigger
  t: number;   // elapsed 0..1
  duration: number; // ms
  startTime: number;
  data?: Record<string, unknown>; // extra payload (e.g. which columns for meteor)
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface Cell {
  color:string; border:string;
  isPowerUp?:boolean; effect?:string; glow?:string;
  symbol?:string; pulse?:string; accent?:string;
  isIce?:boolean; isGold?:boolean; name?:string;
}
interface Piece {
  shape:number[][]; color:string; border:string; name:string;
  isPowerUp?:boolean; effect?:string; glow?:string;
  symbol?:string; pulse?:string; accent?:string;
}
interface GlobalHS   { player_name:string; score:number; }
interface LocalHS    { name:string; score:number; date:string; }
interface SavedState { board:(Cell|null)[][]; score:number; lines:number; level:number; combo:number; }
interface Particle   { x:number; y:number; vx:number; vy:number; life:number; color:string; size:number; }

// ─── Personal best ────────────────────────────────────────────────────────────
const LOCAL_KEY = 'scnd_drop_personal_best';
function loadPersonalBest(): LocalHS | null {
  if (typeof window === 'undefined') return null;
  try { const r = localStorage.getItem(LOCAL_KEY); return r ? JSON.parse(r) : null; } catch { return null; }
}
function savePersonalBest(e: LocalHS): boolean {
  try {
    const cur = loadPersonalBest();
    if (!cur || e.score > cur.score) { localStorage.setItem(LOCAL_KEY, JSON.stringify(e)); return true; }
    return false;
  } catch { return false; }
}

// ─── Pure helpers ─────────────────────────────────────────────────────────────
const emptyBoard = (): (Cell|null)[][] => Array.from({ length: BH }, () => Array(BW).fill(null));

function getCriticalZoneFill(board: (Cell|null)[][]): number {
  const start = Math.floor((BW - CRITICAL_ZONE_SIZE) / 2);
  let occupied = 0;
  for (let dy = 0; dy < CRITICAL_ZONE_SIZE; dy++)
    for (let dx = 0; dx < CRITICAL_ZONE_SIZE; dx++)
      if (board[start + dy][start + dx] !== null) occupied++;
  return occupied / (CRITICAL_ZONE_SIZE * CRITICAL_ZONE_SIZE);
}

function rotateCW(s: number[][]): number[][] {
  const r = s.length, c = s[0].length;
  return Array.from({ length: c }, (_, ci) => Array.from({ length: r }, (_, ri) => s[r-1-ri][ci]));
}
function gravDir(rot: Rot) {
  switch (rot) {
    case 0:   return { dx:0,  dy:1  };
    case 90:  return { dx:1,  dy:0  };
    case 180: return { dx:0,  dy:-1 };
    case 270: return { dx:-1, dy:0  };
  }
}
function s2b(sdx: number, sdy: number, rot: Rot) {
  switch (rot) {
    case 0:   return { dx:sdx,  dy:sdy  };
    case 90:  return { dx:sdy,  dy:-sdx };
    case 180: return { dx:-sdx, dy:-sdy };
    case 270: return { dx:-sdy, dy:sdx  };
  }
}

function anchorMask(board: (Cell|null)[][]): boolean[][] {
  const vis: boolean[][] = Array.from({ length: BH }, () => Array(BW).fill(false));
  const q: [number,number][] = [];
  for (let x = 0; x < BW; x++) {
    if (board[0][x])    { vis[0][x]    = true; q.push([0, x]); }
    if (board[BH-1][x]) { vis[BH-1][x] = true; q.push([BH-1, x]); }
  }
  for (let y = 0; y < BH; y++) {
    if (board[y][0])    { vis[y][0]    = true; q.push([y, 0]); }
    if (board[y][BW-1]) { vis[y][BW-1] = true; q.push([y, BW-1]); }
  }
  while (q.length) {
    const [y, x] = q.pop()!;
    for (const [ny, nx] of [[y-1,x],[y+1,x],[y,x-1],[y,x+1]] as [number,number][]) {
      if (ny>=0&&ny<BH&&nx>=0&&nx<BW&&!vis[ny][nx]&&board[ny][nx]) {
        vis[ny][nx] = true; q.push([ny, nx]);
      }
    }
  }
  return vis;
}

function stepGrav(board: (Cell|null)[][], rot: Rot): { board:(Cell|null)[][]; moved:boolean } {
  const anch = anchorMask(board);
  const next = board.map(r => [...r]) as (Cell|null)[][];
  let moved = false;
  const { dx, dy } = gravDir(rot);
  const ys = dy===1  ? Array.from({length:BH},(_,i)=>BH-1-i)
           : dy===-1 ? Array.from({length:BH},(_,i)=>i)
                     : Array.from({length:BH},(_,i)=>i);
  const xs = dx===1  ? Array.from({length:BW},(_,i)=>BW-1-i)
           : dx===-1 ? Array.from({length:BW},(_,i)=>i)
                     : Array.from({length:BW},(_,i)=>i);
  for (const y of ys) for (const x of xs) {
    if (!next[y][x] || anch[y][x]) continue;
    const ny = y+dy, nx = x+dx;
    if (ny<0||ny>=BH||nx<0||nx>=BW||next[ny][nx]) continue;
    next[ny][nx] = next[y][x]; next[y][x] = null; moved = true;
  }
  return { board: next, moved };
}

function settle(board: (Cell|null)[][], rot: Rot): (Cell|null)[][] {
  let cur = board;
  for (let i = 0; i < BW+BH; i++) {
    const { board: nxt, moved } = stepGrav(cur, rot);
    cur = nxt;
    if (!moved) break;
  }
  return cur;
}

interface LineGroup {
  cells: [number,number][];
  puCells: { y:number; x:number; effect:string; name:string }[];
}

function findLines(board: (Cell|null)[][]): LineGroup[] {
  const groups: LineGroup[] = [];
  const toDelete = new Set<number>();
  for (let y = 0; y < BH; y++) {
    let runStart = -1, runLen = 0;
    for (let x = 0; x <= BW; x++) {
      const occupied = x < BW && board[y][x] !== null;
      if (occupied) { if (runStart === -1) runStart = x; runLen++; }
      else {
        if (runLen >= CLEAR_MIN) {
          const cells: [number,number][] = [];
          const puCells: LineGroup['puCells'] = [];
          for (let i = runStart; i < runStart + runLen; i++) {
            cells.push([y, i]); toDelete.add(y * BW + i);
            const cell = board[y][i]!;
            if (cell.isPowerUp && cell.effect) puCells.push({ y, x:i, effect:cell.effect, name:cell.name??'' });
          }
          groups.push({ cells, puCells });
        }
        runStart = -1; runLen = 0;
      }
    }
  }
  for (let x = 0; x < BW; x++) {
    let runStart = -1, runLen = 0;
    for (let y = 0; y <= BH; y++) {
      const occupied = y < BH && board[y][x] !== null;
      if (occupied) { if (runStart === -1) runStart = y; runLen++; }
      else {
        if (runLen >= CLEAR_MIN) {
          const cells: [number,number][] = [];
          const puCells: LineGroup['puCells'] = [];
          for (let i = runStart; i < runStart + runLen; i++) {
            if (!toDelete.has(i * BW + x)) {
              cells.push([i, x]); toDelete.add(i * BW + x);
              const cell = board[i][x]!;
              if (cell.isPowerUp && cell.effect) puCells.push({ y:i, x, effect:cell.effect, name:cell.name??'' });
            }
          }
          if (cells.length > 0) groups.push({ cells, puCells });
        }
        runStart = -1; runLen = 0;
      }
    }
  }
  return groups;
}

function applyLineClear(
  board: (Cell|null)[][],
  cs: number,
  burst: (x:number, y:number, n?:number) => void
): { board:(Cell|null)[][]; cleared:number; powerUps:{ y:number; x:number; effect:string; name:string }[] } {
  const groups = findLines(board);
  if (!groups.length) return { board, cleared: 0, powerUps: [] };
  const next = board.map(r => [...r]) as (Cell|null)[][];
  let cleared = 0;
  const powerUps: { y:number; x:number; effect:string; name:string }[] = [];
  for (const grp of groups) {
    for (const [y, x] of grp.cells) {
      if (next[y][x]) { burst(x*cs + cs/2, y*cs + cs/2, 6); next[y][x] = null; cleared++; }
    }
    for (const pu of grp.puCells) powerUps.push(pu);
  }
  return { board: next, cleared, powerUps };
}

function settleAndClear(
  board: (Cell|null)[][],
  rot: Rot,
  cs: number,
  burst: (x:number, y:number, n?:number) => void
): { board:(Cell|null)[][]; totalCleared:number; allPowerUps:{ y:number; x:number; effect:string; name:string }[] } {
  let current = board;
  let totalCleared = 0;
  const allPowerUps: { y:number; x:number; effect:string; name:string }[] = [];
  for (let pass = 0; pass < 20; pass++) {
    current = settle(current, rot);
    const { board: afterClear, cleared, powerUps } = applyLineClear(current, cs, burst);
    if (cleared === 0) break;
    current = afterClear;
    totalCleared += cleared;
    allPowerUps.push(...powerUps);
  }
  return { board: current, totalCleared, allPowerUps };
}

function calcCellSize(cw: number, ch: number): number {
  return Math.min(Math.max(8, Math.min(Math.floor((cw-4)/BW), Math.floor((ch-4)/BH))), 64);
}

function getFallMsForLevel(level: number): number {
  const t = Math.min(level-1, 99) / 99;
  const s = t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2, 3)/2;
  return Math.round(2200 - s*(2200-450));
}

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

function drawPauseIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, col: string) {
  const w = size*0.22, h = size*0.5, gap = size*0.14;
  ctx.fillStyle = col;
  ctx.beginPath(); ctx.roundRect(cx-gap-w, cy-h/2, w, h, 2); ctx.fill();
  ctx.beginPath(); ctx.roundRect(cx+gap,   cy-h/2, w, h, 2); ctx.fill();
}

// ─── Power-up Animation Renderer ─────────────────────────────────────────────
function drawPUAnim(
  ctx: CanvasRenderingContext2D,
  anim: PUAnim,
  cs: number,
  cw: number,
  ch: number,
) {
  const t = anim.t; // 0 = start, 1 = end
  const ease = (x: number) => x < 0.5 ? 2*x*x : 1-Math.pow(-2*x+2,2)/2;
  const eased = ease(t);

  ctx.save();

  switch (anim.effect) {

    // ── LASER: two beams shoot from trigger cell across full row + column ──
    case 'laser': {
      const cx = (anim.px + 0.5) * cs;
      const cy = (anim.py + 0.5) * cs;
      // Phase 0-0.3: charge up (pulsing dot)
      // Phase 0.3-0.7: beams expand
      // Phase 0.7-1.0: fade out
      const chargeEnd = 0.25, fireEnd = 0.7;

      if (t < chargeEnd) {
        const tp = t / chargeEnd;
        const r = cs * 0.8 * tp;
        ctx.globalAlpha = 0.9 * tp;
        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
        grad.addColorStop(0, '#FFFFFF');
        grad.addColorStop(0.4, '#4080FF');
        grad.addColorStop(1, 'rgba(64,128,255,0)');
        ctx.fillStyle = grad;
        ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2); ctx.fill();
      } else if (t < fireEnd) {
        const tp = (t - chargeEnd) / (fireEnd - chargeEnd);
        const alpha = Math.min(1, tp * 3);
        // Horizontal beam
        ctx.globalAlpha = alpha;
        const beamH = cs * 0.55;
        const beamGradH = ctx.createLinearGradient(0, cy, cw, cy);
        beamGradH.addColorStop(0, 'rgba(64,128,255,0)');
        beamGradH.addColorStop(0.3, 'rgba(180,220,255,0.9)');
        beamGradH.addColorStop(0.5, '#FFFFFF');
        beamGradH.addColorStop(0.7, 'rgba(180,220,255,0.9)');
        beamGradH.addColorStop(1, 'rgba(64,128,255,0)');
        ctx.fillStyle = beamGradH;
        ctx.fillRect(0, cy - beamH/2, cw, beamH);
        // Core bright line
        ctx.globalAlpha = alpha * 0.95;
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, cy - 2, cw, 4);
        // Vertical beam
        ctx.globalAlpha = alpha * 0.85;
        const beamGradV = ctx.createLinearGradient(cx, 0, cx, ch);
        beamGradV.addColorStop(0, 'rgba(64,128,255,0)');
        beamGradV.addColorStop(0.3, 'rgba(180,220,255,0.9)');
        beamGradV.addColorStop(0.5, '#FFFFFF');
        beamGradV.addColorStop(0.7, 'rgba(180,220,255,0.9)');
        beamGradV.addColorStop(1, 'rgba(64,128,255,0)');
        const beamV = cs * 0.55;
        ctx.fillStyle = beamGradV;
        ctx.fillRect(cx - beamV/2, 0, beamV, ch);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(cx - 2, 0, 4, ch);
        // Center flash
        ctx.globalAlpha = alpha * 0.9;
        const flash = ctx.createRadialGradient(cx, cy, 0, cx, cy, cs*1.5);
        flash.addColorStop(0, 'rgba(255,255,255,0.95)');
        flash.addColorStop(0.3, 'rgba(64,128,255,0.6)');
        flash.addColorStop(1, 'rgba(64,128,255,0)');
        ctx.fillStyle = flash;
        ctx.beginPath(); ctx.arc(cx, cy, cs*1.5, 0, Math.PI*2); ctx.fill();
      } else {
        const tp = (t - fireEnd) / (1 - fireEnd);
        ctx.globalAlpha = (1-tp) * 0.6;
        ctx.fillStyle = 'rgba(64,128,255,0.3)';
        ctx.fillRect(0, (anim.py)*cs, cw, cs);
        ctx.fillRect((anim.px)*cs, 0, cs, ch);
      }
      break;
    }

    // ── BOMB: expanding ring + shockwave ──────────────────────────────────
    case 'bomb': {
      const cx = (anim.px + 0.5) * cs;
      const cy = (anim.py + 0.5) * cs;
      const maxR = cs * 2.2;

      if (t < 0.15) {
        // Flash
        ctx.globalAlpha = (1 - t/0.15) * 0.8;
        ctx.fillStyle = '#FFAA44';
        ctx.beginPath(); ctx.arc(cx, cy, cs*1.5*(t/0.15), 0, Math.PI*2); ctx.fill();
      } else {
        const tp = (t - 0.15) / 0.85;
        const r = maxR * ease(tp);
        // Outer ring
        ctx.globalAlpha = (1-tp) * 0.9;
        ctx.strokeStyle = '#FF6020';
        ctx.lineWidth = cs * 0.3 * (1-tp);
        ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2); ctx.stroke();
        // Inner glow
        ctx.globalAlpha = (1-tp) * 0.6;
        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r*0.8);
        grad.addColorStop(0, 'rgba(255,180,60,0.7)');
        grad.addColorStop(0.5, 'rgba(255,80,20,0.4)');
        grad.addColorStop(1, 'rgba(255,60,0,0)');
        ctx.fillStyle = grad;
        ctx.beginPath(); ctx.arc(cx, cy, r*0.8, 0, Math.PI*2); ctx.fill();
        // Shockwave ring (faster)
        if (tp > 0.2) {
          const tp2 = (tp - 0.2) / 0.8;
          ctx.globalAlpha = (1-tp2) * 0.5;
          ctx.strokeStyle = '#FFFF88';
          ctx.lineWidth = 2;
          ctx.beginPath(); ctx.arc(cx, cy, maxR * 1.5 * tp2, 0, Math.PI*2); ctx.stroke();
        }
      }
      break;
    }

    // ── MEGA BOMB: huge explosion with multiple rings ─────────────────────
    case 'megaBomb': {
      const cx = (anim.px + 0.5) * cs;
      const cy = (anim.py + 0.5) * cs;
      const maxR = cs * 3.5;

      if (t < 0.1) {
        ctx.globalAlpha = t/0.1;
        const flash = ctx.createRadialGradient(cx, cy, 0, cx, cy, cs*2);
        flash.addColorStop(0, 'rgba(255,255,255,1)');
        flash.addColorStop(0.5, 'rgba(255,80,40,0.8)');
        flash.addColorStop(1, 'rgba(255,80,40,0)');
        ctx.fillStyle = flash;
        ctx.beginPath(); ctx.arc(cx, cy, cs*2, 0, Math.PI*2); ctx.fill();
      } else {
        const tp = (t - 0.1) / 0.9;
        for (let ring = 0; ring < 3; ring++) {
          const delay = ring * 0.15;
          if (tp < delay) continue;
          const rtp = Math.min(1, (tp - delay) / 0.7);
          const r = maxR * (0.5 + ring * 0.3) * ease(rtp);
          ctx.globalAlpha = (1-rtp) * (0.9 - ring * 0.2);
          ctx.strokeStyle = ring === 0 ? '#FFFFFF' : ring === 1 ? '#FF6020' : '#FF2000';
          ctx.lineWidth = cs * (0.4 - ring*0.1) * (1-rtp) + 1;
          ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2); ctx.stroke();
        }
        // Heat shimmer overlay
        ctx.globalAlpha = (1-eased) * 0.2;
        ctx.fillStyle = '#FF4400';
        ctx.fillRect(0, 0, cw, ch);
      }
      break;
    }

    // ── FREEZE: ice crystal spreads outward from center ───────────────────
    case 'freeze': {
      const cx = (anim.px + 0.5) * cs;
      const cy = (anim.py + 0.5) * cs;

      if (t < 0.4) {
        const tp = t / 0.4;
        // Crystal burst from center
        ctx.globalAlpha = tp * 0.9;
        for (let i = 0; i < 6; i++) {
          const angle = (i / 6) * Math.PI * 2;
          const len = cs * 3.5 * ease(tp);
          ctx.strokeStyle = '#88EEFF';
          ctx.lineWidth = Math.max(1, cs * 0.15 * (1-tp*0.5));
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.lineTo(cx + Math.cos(angle)*len, cy + Math.sin(angle)*len);
          ctx.stroke();
          // Branch crystals
          if (tp > 0.4) {
            const branchLen = len * 0.4;
            const btp = (tp - 0.4) / 0.6;
            for (const bSign of [-1, 1]) {
              const bAngle = angle + bSign * Math.PI / 5;
              const bx = cx + Math.cos(angle)*len*0.6;
              const by = cy + Math.sin(angle)*len*0.6;
              ctx.globalAlpha = tp * 0.7 * btp;
              ctx.beginPath();
              ctx.moveTo(bx, by);
              ctx.lineTo(bx + Math.cos(bAngle)*branchLen*btp, by + Math.sin(bAngle)*branchLen*btp);
              ctx.stroke();
            }
          }
        }
      } else {
        const tp = (t - 0.4) / 0.6;
        // Full board frost overlay
        ctx.globalAlpha = (1-tp) * 0.25;
        ctx.fillStyle = '#88EEFF';
        ctx.fillRect(0, 0, cw, ch);
        // Snowflake pattern
        ctx.globalAlpha = (1-tp) * 0.5;
        ctx.strokeStyle = '#CCFFFF';
        ctx.lineWidth = 1;
        for (let y = 0; y < BH; y += 3) {
          for (let x = 0; x < BW; x += 3) {
            const fx = (x + 0.5) * cs, fy = (y + 0.5) * cs;
            for (let i = 0; i < 4; i++) {
              const a = (i / 4) * Math.PI;
              ctx.beginPath(); ctx.moveTo(fx - Math.cos(a)*cs*0.35, fy - Math.sin(a)*cs*0.35);
              ctx.lineTo(fx + Math.cos(a)*cs*0.35, fy + Math.sin(a)*cs*0.35); ctx.stroke();
            }
          }
        }
      }
      break;
    }

    // ── METEOR: 3 columns get struck from above ───────────────────────────
    case 'meteor': {
      const cols = (anim.data?.cols as number[]) || [0, 7, 14];
      for (let ci = 0; ci < cols.length; ci++) {
        const delay = ci * 0.12;
        if (t < delay) continue;
        const tp = Math.min(1, (t - delay) / 0.8);
        const col = cols[ci];
        const cx = (col + 0.5) * cs;

        if (tp < 0.5) {
          // Meteor falling down
          const yEnd = ch * tp * 2;
          ctx.globalAlpha = (1 - tp * 0.5) * 0.9;
          const grad = ctx.createLinearGradient(cx, 0, cx, yEnd);
          grad.addColorStop(0, 'rgba(255,140,0,0)');
          grad.addColorStop(0.5, 'rgba(255,180,0,0.8)');
          grad.addColorStop(1, 'rgba(255,80,0,1)');
          ctx.fillStyle = grad;
          ctx.fillRect(cx - cs*0.4, 0, cs*0.8, yEnd);
          // Head glow
          ctx.globalAlpha = 0.9;
          const headGrad = ctx.createRadialGradient(cx, yEnd, 0, cx, yEnd, cs*0.9);
          headGrad.addColorStop(0, '#FFFFFF');
          headGrad.addColorStop(0.3, '#FF8C00');
          headGrad.addColorStop(1, 'rgba(255,80,0,0)');
          ctx.fillStyle = headGrad;
          ctx.beginPath(); ctx.arc(cx, yEnd, cs*0.9, 0, Math.PI*2); ctx.fill();
        } else {
          // Impact shockwave
          const itp = (tp - 0.5) / 0.5;
          ctx.globalAlpha = (1-itp) * 0.8;
          ctx.strokeStyle = '#FF8C00';
          ctx.lineWidth = cs * 0.25 * (1-itp) + 1;
          ctx.beginPath(); ctx.arc(cx, ch * 0.5, cs * 2 * itp, 0, Math.PI*2); ctx.stroke();
          // Column flash
          ctx.globalAlpha = (1-itp) * 0.4;
          ctx.fillStyle = '#FF8C00';
          ctx.fillRect(col * cs, 0, cs, ch);
        }
      }
      break;
    }

    // ── CLEAR COLOR: rainbow wave sweeps across board ─────────────────────
    case 'clearColor': {
      const sweepX = eased * cw;
      // Wave front
      ctx.globalAlpha = 0.7 * (t < 0.8 ? 1 : (1-t)/0.2);
      const waveGrad = ctx.createLinearGradient(sweepX - cs*2, 0, sweepX + cs, 0);
      waveGrad.addColorStop(0, 'rgba(155,112,184,0)');
      waveGrad.addColorStop(0.3, 'rgba(155,112,184,0.6)');
      waveGrad.addColorStop(0.7, 'rgba(224,208,255,0.9)');
      waveGrad.addColorStop(1, 'rgba(224,208,255,0)');
      ctx.fillStyle = waveGrad;
      ctx.fillRect(0, 0, cw, ch);
      // Sparkle trail
      if (t < 0.8) {
        ctx.globalAlpha = 0.8;
        ctx.fillStyle = '#FFFFFF';
        for (let i = 0; i < 5; i++) {
          const sx = sweepX - i * cs * 0.3;
          const sy = (Math.sin(t * 10 + i * 1.3) * 0.4 + 0.5) * ch;
          ctx.beginPath(); ctx.arc(sx, sy, 2 + i, 0, Math.PI*2); ctx.fill();
        }
      }
      break;
    }

    // ── DOUBLE / SCND BONUS: golden / orange score burst ──────────────────
    case 'doubleScore':
    case 'scndBonus': {
      const col1 = anim.effect === 'scndBonus' ? '#FFC27A' : '#FFDC71';
      const col2 = anim.effect === 'scndBonus' ? '#FF8C00' : '#FFD700';
      // Radiating gold rings from center
      for (let ring = 0; ring < 4; ring++) {
        const delay = ring * 0.1;
        if (t < delay) continue;
        const rtp = Math.min(1, (t - delay) / 0.7);
        const r = (cw * 0.5) * ease(rtp);
        ctx.globalAlpha = (1-rtp) * 0.6;
        ctx.strokeStyle = ring % 2 === 0 ? col1 : col2;
        ctx.lineWidth = 3 * (1-rtp) + 1;
        ctx.beginPath(); ctx.arc(cw/2, ch/2, r, 0, Math.PI*2); ctx.stroke();
      }
      // Center star burst
      if (t < 0.5) {
        const tp = t / 0.5;
        ctx.globalAlpha = (1-tp) * 0.5;
        ctx.fillStyle = col2;
        for (let i = 0; i < 8; i++) {
          const angle = (i/8)*Math.PI*2;
          const len = cs * 3 * tp;
          ctx.beginPath();
          ctx.moveTo(cw/2, ch/2);
          ctx.lineTo(cw/2 + Math.cos(angle)*len, ch/2 + Math.sin(angle)*len);
          ctx.lineWidth = cs * 0.15 * (1-tp);
          ctx.strokeStyle = col1;
          ctx.stroke();
        }
      }
      break;
    }

    // ── SHIELD: hexagonal barrier materializes ────────────────────────────
    case 'shield': {
      const cx = cw/2, cy = ch/2;
      const maxR = Math.min(cw, ch) * 0.45;
      const r = maxR * (t < 0.3 ? ease(t/0.3) : 1);
      const alpha = t < 0.3 ? 1 : t < 0.7 ? 1 : (1-t)/0.3;
      // Hexagon
      ctx.globalAlpha = Math.max(0, alpha) * 0.7;
      ctx.strokeStyle = '#E5E0D8';
      ctx.lineWidth = cs * 0.15 * (t < 0.3 ? t/0.3 : 1);
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = (i/6)*Math.PI*2 - Math.PI/6;
        if (i===0) ctx.moveTo(cx+Math.cos(a)*r, cy+Math.sin(a)*r);
        else ctx.lineTo(cx+Math.cos(a)*r, cy+Math.sin(a)*r);
      }
      ctx.closePath(); ctx.stroke();
      // Glow fill
      ctx.globalAlpha = Math.max(0, alpha) * 0.15;
      ctx.fillStyle = '#538BB9';
      ctx.fill();
      // Rim light
      ctx.globalAlpha = Math.max(0, alpha) * 0.4;
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2;
      ctx.stroke();
      break;
    }

    // ── GRAVITY: blocks rain down from top ────────────────────────────────
    case 'gravity': {
      const numDrops = 12;
      for (let i = 0; i < numDrops; i++) {
        const delay = (i / numDrops) * 0.4;
        if (t < delay) continue;
        const tp = Math.min(1, (t - delay) / 0.6);
        const x = ((i * 137.5) % BW) * cs + cs/2;
        const y = ch * ease(tp);
        const pal = BLOCK_COLORS[i % BLOCK_COLORS.length];
        ctx.globalAlpha = (1-tp) * 0.85;
        ctx.fillStyle = pal.color;
        const sz = cs * 0.6 * (1-tp*0.3);
        ctx.fillRect(x - sz/2, y - sz/2, sz, sz);
        // Trail
        ctx.globalAlpha = (1-tp) * 0.3;
        ctx.fillStyle = pal.color;
        ctx.fillRect(x - sz*0.3, y - sz*1.5, sz*0.6, sz*1.2);
      }
      break;
    }

    // ── REWIND: clockwise time spiral rewinds ─────────────────────────────
    case 'rewind': {
      const cx = cw/2, cy = ch/2;
      const maxR = Math.min(cw, ch) * 0.45;
      // Spiral arc growing backward
      ctx.globalAlpha = (t < 0.8 ? 0.9 : (1-t)/0.2);
      ctx.strokeStyle = '#58D1C6';
      ctx.lineWidth = cs * 0.15;
      ctx.lineCap = 'round';
      const turns = 2.5;
      const steps = 80;
      ctx.beginPath();
      for (let i = 0; i <= steps; i++) {
        const pct = i / steps;
        if (pct > t) break;
        const angle = -pct * turns * Math.PI * 2 + Math.PI * 0.5;
        const r = maxR * pct * (eased);
        const x = cx + Math.cos(angle) * r;
        const y = cy + Math.sin(angle) * r;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
      // Clock overlay
      ctx.globalAlpha = (t < 0.5 ? t/0.5 : (1-t)/0.5) * 0.4;
      ctx.strokeStyle = '#A0EEFF';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(cx, cy, maxR * 0.55, 0, Math.PI*2); ctx.stroke();
      // Clock hands spinning backward
      const handAngle = -t * Math.PI * 4;
      ctx.strokeStyle = '#CCFFFF';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(handAngle)*maxR*0.4, cy + Math.sin(handAngle)*maxR*0.4);
      ctx.stroke();
      break;
    }

    // ── SWAP: two-color vortex swirl ──────────────────────────────────────
    case 'swap': {
      const cx = cw/2, cy = ch/2;
      const angle = t * Math.PI * 4;
      const maxR = Math.min(cw, ch) * 0.4;
      for (let arm = 0; arm < 2; arm++) {
        const baseAngle = angle + arm * Math.PI;
        for (let i = 0; i < 20; i++) {
          const pct = i / 20;
          const r = maxR * pct * eased;
          const a = baseAngle + pct * Math.PI * 2;
          const px = cx + Math.cos(a) * r;
          const py = cy + Math.sin(a) * r;
          ctx.globalAlpha = (1-pct) * (1-t*0.7) * 0.8;
          ctx.fillStyle = arm === 0 ? '#C24B6E' : '#538BB9';
          const sz = cs * 0.3 * (1-pct*0.5);
          ctx.fillRect(px-sz/2, py-sz/2, sz, sz);
        }
      }
      // Flash on center
      if (t < 0.3) {
        ctx.globalAlpha = (1 - t/0.3) * 0.6;
        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, cs*2);
        grad.addColorStop(0, 'rgba(255,255,255,0.9)');
        grad.addColorStop(1, 'rgba(200,128,160,0)');
        ctx.fillStyle = grad;
        ctx.beginPath(); ctx.arc(cx, cy, cs*2, 0, Math.PI*2); ctx.fill();
      }
      break;
    }

    default: break;
  }

  ctx.restore();
}

// ─── Dark / mobile hooks ──────────────────────────────────────────────────────
function useIsDark(): boolean {
  const [v, set] = useState(true);
  useEffect(() => {
    const chk = () => set(!document.documentElement.classList.contains('light'));
    chk();
    const obs = new MutationObserver(chk);
    obs.observe(document.documentElement, { attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);
  return v;
}
function useIsMobile(): boolean {
  const [v, set] = useState(false);
  useEffect(() => {
    const chk = () => set(window.innerWidth < 600);
    chk();
    window.addEventListener('resize', chk);
    return () => window.removeEventListener('resize', chk);
  }, []);
  return v;
}

// ─── Component ────────────────────────────────────────────────────────────────
export function ScndDropGame() {
  const areaRef    = useRef<HTMLDivElement>(null);
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null); // ← new: power-up animation layer
  const isDark     = useIsDark();
  const isMobile   = useIsMobile();
  const isDarkRef  = useRef(isDark);
  useEffect(() => { isDarkRef.current = isDark; }, [isDark]);

  const boardRef    = useRef<(Cell|null)[][]>(emptyBoard());
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

  // Power-up animations queue
  const puAnimsRef  = useRef<PUAnim[]>([]);
  const overlayRaf  = useRef(0);

  const [uiScore,      setUiScore]      = useState(0);
  const [uiLevel,      setUiLevel]      = useState(1);
  const [uiLines,      setUiLines]      = useState(0);
  const [uiCombo,      setUiCombo]      = useState(0);
  const [playing,      setPlaying]      = useState(false);
  const [paused,       setPaused]       = useState(false);
  const [gameOver,     setGameOver]     = useState(false);
  const [finalSc,      setFinalSc]      = useState(0);
  const [bonus,        setBonus]        = useState('');
  const [puName,       setPuName]       = useState('');
  const [flags,        setFlags]        = useState({ freeze:false, slow:false, fast:false, shield:false, double:false, scnd:false });
  const [globalHS,     setGlobalHS]     = useState<GlobalHS[]>([]);
  const [personalBest, setPersonalBest] = useState<LocalHS|null>(null);
  const [isNewRecord,  setIsNewRecord]  = useState(false);
  // ── FIX: showName is now controlled purely by gameOver + score > 0 ────────
  const [showName,     setShowName]     = useState(false);
  const [pname,        setPname]        = useState('');
  const [saving,       setSaving]       = useState(false);
  const [csize,        setCsize]        = useState({ w:200, h:200 });

  useEffect(() => { setPersonalBest(loadPersonalBest()); }, []);

  const recalc = useCallback(() => {
    if (!areaRef.current) return;
    const r = areaRef.current.getBoundingClientRect();
    const cs = calcCellSize(r.width, r.height);
    csRef.current = cs;
    setCsize({ w: BW*cs, h: BH*cs });
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
  const showBonus = useCallback((txt: string) => { setBonus(txt); setTimeout(() => setBonus(''), 1800); }, []);
  const burst = useCallback((bx: number, by: number, n = 10) => {
    const cols = [BRAND,'#FF8800','#FFDC71','#76C662','#58D1C6','#9B70B8','#EA8E77'];
    for (let i = 0; i < n; i++) partsRef.current.push({
      x: bx, y: by,
      vx: (Math.random()-.5)*6, vy: (Math.random()-.5)*6,
      life: 1, size: 2+Math.random()*3,
      color: cols[Math.floor(Math.random()*cols.length)],
    });
  }, []);

  // ── Spawn a power-up animation ─────────────────────────────────────────
  const spawnPUAnim = useCallback((effect: string, px: number, py: number, data?: Record<string, unknown>) => {
    const durationMap: Record<string, number> = {
      laser:       900,
      bomb:        700,
      megaBomb:    1100,
      freeze:      1000,
      meteor:      1200,
      clearColor:  800,
      doubleScore: 900,
      scndBonus:   900,
      shield:      1000,
      gravity:     900,
      rewind:      1100,
      swap:        800,
    };
    const dur = durationMap[effect] ?? 700;
    puAnimsRef.current.push({
      effect, px, py, t: 0, duration: dur, startTime: performance.now(), data,
    });
  }, []);

  // ── Overlay animation loop ─────────────────────────────────────────────
  const overlayLoop = useCallback((now: number) => {
    const canvas = overlayRef.current;
    if (!canvas) { overlayRaf.current = requestAnimationFrame(overlayLoop); return; }
    const ctx = canvas.getContext('2d');
    if (!ctx) { overlayRaf.current = requestAnimationFrame(overlayLoop); return; }
    const cs = csRef.current;
    const cw = BW * cs, ch = BH * cs;
    canvas.width = cw; canvas.height = ch;
    ctx.clearRect(0, 0, cw, ch);

    // Update and draw all active animations
    puAnimsRef.current = puAnimsRef.current.filter(anim => {
      anim.t = Math.min(1, (now - anim.startTime) / anim.duration);
      drawPUAnim(ctx, anim, cs, cw, ch);
      return anim.t < 1;
    });

    overlayRaf.current = requestAnimationFrame(overlayLoop);
  }, []);

  useEffect(() => {
    overlayRaf.current = requestAnimationFrame(overlayLoop);
    return () => cancelAnimationFrame(overlayRaf.current);
  }, [overlayLoop]);

  const hits = useCallback((shape: number[][], ox: number, oy: number): boolean => {
    const b = boardRef.current;
    for (let y = 0; y < shape.length; y++) for (let x = 0; x < shape[y].length; x++) {
      if (!shape[y][x]) continue;
      const bx = ox+x, by = oy+y;
      if (bx<0||bx>=BW||by<0||by>=BH) return true;
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

  const spawn = useCallback((): boolean => {
    const isPU = Math.random() < 0.14;
    const pool = isPU ? POWERUPS : TETROMINOS;
    const src  = pool[Math.floor(Math.random() * pool.length)];
    const piece: Piece = {
      shape: src.shape.map(r => [...r]),
      color: src.color, border: src.border, name: src.name, isPowerUp: isPU,
      effect: isPU ? (src as PUDef).effect : undefined,
      glow:   isPU ? (src as PUDef).glow   : undefined,
      symbol: isPU ? (src as PUDef).symbol : undefined,
      pulse:  isPU ? (src as PUDef).pulse  : undefined,
      accent: isPU ? (src as PUDef).accent : undefined,
    };
    const pw = piece.shape[0].length, ph = piece.shape.length;
    const idealX = Math.floor((BW - pw) / 2);
    const idealY = Math.floor((BH - ph) / 2);
    const maxR = Math.max(BW, BH);
    for (let r = 0; r <= maxR; r++) {
      const candidates: [number,number][] = [];
      for (let dy = -r; dy <= r; dy++)
        for (let dx = -r; dx <= r; dx++)
          if (Math.abs(dx) + Math.abs(dy) === r) candidates.push([dx, dy]);
      candidates.sort((a, b) => a[0]*a[0]+a[1]*a[1] - b[0]*b[0]-b[1]*b[1]);
      for (const [dx, dy] of candidates) {
        const tx = idealX + dx, ty = idealY + dy;
        if (tx >= 0 && tx+pw <= BW && ty >= 0 && ty+ph <= BH && !hits(piece.shape, tx, ty)) {
          pieceRef.current = piece; pxRef.current = tx; pyRef.current = ty;
          return true;
        }
      }
    }
    return false;
  }, [hits]);

  const triggerPU = useCallback((effect: string, px: number, py: number, name: string) => {
    setPuName(name); showBonus(`${name}!`);
    const cs = csRef.current;
    burst(px*cs+cs/2, py*cs+cs/2, 30);

    // ── Spawn the visual animation ──────────────────────────────────────
    const animData: Record<string, unknown> = {};
    if (effect === 'meteor') {
      // precompute which cols so animation matches reality
      const b = boardRef.current;
      const freq: Record<number, number> = {};
      for (let y = 0; y < BH; y++) for (let x = 0; x < BW; x++) if (b[y][x]) freq[x] = (freq[x]||0)+1;
      const sorted = Object.keys(freq).map(Number).sort((a,b2)=>freq[b2]-freq[a]);
      animData.cols = sorted.slice(0, 3).length > 0
        ? sorted.slice(0, 3)
        : Array.from({length:BW},(_,i)=>i).sort(()=>Math.random()-.5).slice(0,3);
    }
    spawnPUAnim(effect, px, py, animData);

    const b = boardRef.current.map(r => [...r]) as (Cell|null)[][];
    let puScore = 0;

    switch (effect) {
      case 'bomb': {
        let cnt = 0;
        for (let dy=-2;dy<=2;dy++) for (let dx=-2;dx<=2;dx++) {
          const nx=px+dx, ny=py+dy;
          if (nx>=0&&nx<BW&&ny>=0&&ny<BH&&b[ny][nx]) { burst(nx*cs+cs/2,ny*cs+cs/2,4); b[ny][nx]=null; cnt++; }
        }
        boardRef.current = settle(b, rotRef.current); puScore = cnt*300; break;
      }
      case 'laser': {
        let cnt = 0;
        for (let x=0;x<BW;x++) if(b[py][x]){burst(x*cs+cs/2,py*cs+cs/2,4);b[py][x]=null;cnt++;}
        for (let y=0;y<BH;y++) if(b[y][px]){burst(px*cs+cs/2,y*cs+cs/2,4);b[y][px]=null;cnt++;}
        boardRef.current = settle(b, rotRef.current); puScore = cnt*450; break;
      }
      case 'scndBonus':
        scndRef.current=true; updFlags();
        setTimeout(()=>{scndRef.current=false;updFlags();},20000);
        puScore=1000; break;
      case 'freeze':
        freezeRef.current=true; updFlags();
        setTimeout(()=>{freezeRef.current=false;updFlags();},4000);
        puScore=300; break;
      case 'gravity':
        boardRef.current = settle(b, rotRef.current); puScore=250; break;
      case 'clearColor': {
        const freq: Record<string,number> = {};
        for (let y=0;y<BH;y++) for (let x=0;x<BW;x++) if(b[y][x]&&!b[y][x]!.isPowerUp) {
          const c = b[y][x]!.color; freq[c] = (freq[c]||0)+1;
        }
        const topColor = Object.entries(freq).sort((a,b2)=>b2[1]-a[1])[0]?.[0];
        let cnt = 0;
        if (topColor) for (let y=0;y<BH;y++) for (let x=0;x<BW;x++) if(b[y][x]?.color===topColor) {
          burst(x*cs+cs/2,y*cs+cs/2,3); b[y][x]=null; cnt++;
        }
        boardRef.current = settle(b, rotRef.current); puScore=cnt*300; break;
      }
      case 'doubleScore':
        doubleRef.current=true; updFlags();
        setTimeout(()=>{doubleRef.current=false;updFlags();},15000);
        puScore=500; break;
      case 'shield':
        shieldRef.current=true; updFlags();
        setTimeout(()=>{shieldRef.current=false;updFlags();},12000);
        puScore=850; break;
      case 'megaBomb': {
        let cnt = 0;
        for (let dy=-3;dy<=3;dy++) for (let dx=-3;dx<=3;dx++) {
          const nx=px+dx, ny=py+dy;
          if (nx>=0&&nx<BW&&ny>=0&&ny<BH&&b[ny][nx]) { burst(nx*cs+cs/2,ny*cs+cs/2,6); b[ny][nx]=null; cnt++; }
        }
        boardRef.current = settle(b, rotRef.current); puScore=cnt*750; break;
      }
      case 'meteor': {
        const cols = Array.from({length:BW},(_,i)=>i).sort(()=>Math.random()-.5).slice(0,3);
        let cnt = 0;
        for (const col of cols) for (let y=0;y<BH;y++) if(b[y][col]){burst(col*cs+cs/2,y*cs+cs/2,4);b[y][col]=null;cnt++;}
        boardRef.current = settle(b, rotRef.current); puScore=cnt*500; break;
      }
      case 'rewind':
        if (histRef.current.length > 0) {
          const st = histRef.current.pop()!;
          boardRef.current=st.board; scoreRef.current=st.score; linesRef.current=st.lines;
          levelRef.current=st.level; comboRef.current=st.combo;
          setUiScore(st.score); setUiLines(st.lines); setUiLevel(st.level); setUiCombo(st.combo);
          showBonus('ZEITREISE!');
        }
        puScore=0; break;
      case 'swap': {
        const colorSet = new Set<string>();
        for (let y=0;y<BH;y++) for (let x=0;x<BW;x++) if(b[y][x]&&!b[y][x]!.isPowerUp) colorSet.add(b[y][x]!.color);
        const cols2 = Array.from(colorSet).sort(()=>Math.random()-.5);
        if (cols2.length >= 2) {
          const [ca, cb2] = cols2;
          for (let y=0;y<BH;y++) for (let x=0;x<BW;x++) {
            if (b[y][x]?.color===ca)  b[y][x]={...b[y][x]!,color:cb2};
            else if(b[y][x]?.color===cb2) b[y][x]={...b[y][x]!,color:ca};
          }
          boardRef.current = b;
          burst(px*cs+cs/2, py*cs+cs/2, 20);
        }
        puScore=500; break;
      }
      default: break;
    }

    let mult = 1;
    if (scndRef.current) mult*=3; if (doubleRef.current) mult*=2;
    puScore = Math.floor(puScore * mult);
    if (puScore > 0) { scoreRef.current += puScore; setUiScore(scoreRef.current); }
    setTimeout(() => setPuName(''), 2500);
  }, [burst, showBonus, updFlags, spawnPUAnim]);

  const endGame = useCallback(() => {
    playRef.current=false; goRef.current=true;
    cancelAnimationFrame(rafRef.current); cancelAnimationFrame(gravRaf.current);
    const finalScore = scoreRef.current;
    setPlaying(false); setGameOver(true); setFinalSc(finalScore);
    setIsNewRecord(false);
    // ── FIX: always show name input if score > 0 ─────────────────────────
    if (finalScore > 0) {
      setShowName(true);
    }
    fetch('/api/game-highscores').then(r=>r.json()).then(d=>{if(Array.isArray(d))setGlobalHS(d);}).catch(()=>{});
  }, []);

  const merge = useCallback(() => {
    const p = pieceRef.current; if (!p) return;
    histRef.current = [...histRef.current.slice(-4), {
      board: boardRef.current.map(r => [...r]),
      score: scoreRef.current, lines: linesRef.current,
      level: levelRef.current, combo: comboRef.current,
    }];
    let nb = boardRef.current.map(r => [...r]) as (Cell|null)[][];
    for (let y=0;y<p.shape.length;y++) for (let x=0;x<p.shape[y].length;x++) {
      if (!p.shape[y][x]) continue;
      const bx=pxRef.current+x, by=pyRef.current+y;
      if (bx<0||bx>=BW||by<0||by>=BH) continue;
      nb[by][bx] = {
        color:p.color, border:p.border, isPowerUp:p.isPowerUp,
        effect:p.effect, glow:p.glow, symbol:p.symbol, pulse:p.pulse, accent:p.accent,
        name: p.name,
        isIce:  !p.isPowerUp && Math.random()<0.05,
        isGold: !p.isPowerUp && Math.random()<0.04,
      };
    }
    const cs = csRef.current;
    const { board: afterAll, totalCleared, allPowerUps } = settleAndClear(nb, rotRef.current, cs, burst);
    boardRef.current = afterAll;
    const fillPercent = getCriticalZoneFill(boardRef.current);
    if (fillPercent >= CRITICAL_ZONE_MAX_FILL) { endGame(); return; }

    let added = 0;
    if (totalCleared > 0) {
      comboRef.current += 1;
      let m = 1 + comboRef.current*0.25;
      if (scndRef.current) m*=3; if (doubleRef.current) m*=2;
      added = Math.floor(totalCleared*150*m*(1+totalCleared/10));
    } else comboRef.current = 0;

    scoreRef.current += added;
    linesRef.current += totalCleared;
    levelRef.current  = Math.floor(linesRef.current/40)+1;
    setUiScore(scoreRef.current); setUiLines(linesRef.current);
    setUiLevel(levelRef.current); setUiCombo(comboRef.current);

    for (const pu of allPowerUps) triggerPU(pu.effect, pu.x, pu.y, pu.name);

    bpRef.current++;
    if (bpRef.current >= bpLimRef.current) {
      bpRef.current = 0; bpLimRef.current = Math.floor(Math.random()*5)+3;
      doRot();
    }
    if (!spawn()) endGame();
  }, [burst, spawn, triggerPU, endGame]);

  const move = useCallback((sdx: number, sdy: number) => {
    const p = pieceRef.current;
    if (!p||!playRef.current||pauseRef.current||goRef.current||freezeRef.current) return;
    const { dx, dy } = s2b(sdx, sdy, rotRef.current);
    const nx = pxRef.current+dx, ny = pyRef.current+dy;
    if (!hits(p.shape, nx, ny)) { pxRef.current=nx; pyRef.current=ny; }
    else if (sdy===1) merge();
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
    if (overlayRef.current) {
      overlayRef.current.style.transform = `rotate(${next}deg)`;
      overlayRef.current.style.transition = 'transform 0.4s cubic-bezier(0.2,0.9,0.4,1.1)';
    }
    if (typeof window !== 'undefined' && window.navigator.vibrate) window.navigator.vibrate(80);
  }, []);

  const getFallMs = useCallback((): number => {
    if (freezeRef.current) return Infinity;
    let ms = getFallMsForLevel(levelRef.current);
    if (slowRef.current) ms*=2; if (fastRef.current) ms/=2;
    return ms;
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    const cs = csRef.current;
    const cw = BW*cs, ch = BH*cs;
    canvas.width = cw; canvas.height = ch;
    const t = pulseRef.current;
    const T = getTheme(isDarkRef.current);

    ctx.fillStyle = T.canvasBg; ctx.fillRect(0,0,cw,ch);
    ctx.strokeStyle = T.gridLine; ctx.lineWidth = 1;
    for (let x=0;x<=BW;x++){ctx.beginPath();ctx.moveTo(x*cs,0);ctx.lineTo(x*cs,ch);ctx.stroke();}
    for (let y=0;y<=BH;y++){ctx.beginPath();ctx.moveTo(0,y*cs);ctx.lineTo(cw,y*cs);ctx.stroke();}
    ctx.strokeStyle = BRAND; ctx.lineWidth = 2; ctx.strokeRect(1,1,cw-2,ch-2);

    const previewGroups = findLines(boardRef.current);
    for (const grp of previewGroups) {
      ctx.fillStyle = 'rgba(255,68,0,0.09)';
      for (const [y, x] of grp.cells) ctx.fillRect(x*cs, y*cs, cs-1, cs-1);
    }

    const board = boardRef.current;
    for (let y=0;y<BH;y++) for (let x=0;x<BW;x++) {
      const cell = board[y][x]; if (!cell) continue;
      const cx = x*cs, cy = y*cs;
      if (cell.isPowerUp&&cell.glow) { ctx.shadowBlur=6+5*Math.sin(t*1.5); ctx.shadowColor=cell.glow; }
      ctx.fillStyle = cell.color; ctx.fillRect(cx,cy,cs-1,cs-1);
      ctx.fillStyle = cell.border; ctx.fillRect(cx,cy,cs-1,2); ctx.fillRect(cx,cy,2,cs-1);
      ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fillRect(cx,cy+cs-3,cs-1,2); ctx.fillRect(cx+cs-3,cy,2,cs-1);
      ctx.shadowBlur = 0;
      if (cell.isIce)  { ctx.fillStyle='rgba(88,209,198,0.28)';ctx.fillRect(cx,cy,cs-1,cs-1);ctx.fillStyle='rgba(255,255,255,0.5)';ctx.fillRect(cx+cs*0.2,cy+cs*0.2,2,2); }
      if (cell.isGold) { const gs=0.25+0.2*Math.sin(t*2+x*0.7+y*0.5);ctx.fillStyle=`rgba(255,220,60,${gs})`;ctx.fillRect(cx,cy,cs-1,cs-1); }
      if (cell.isPowerUp&&cell.symbol&&cell.accent&&cs>=10) {
        const scl = cell.pulse==='breathe'?0.75+0.25*Math.sin(t*2):cell.pulse==='flicker'?(Math.random()>0.12?1:0.5):1;
        const ang = cell.pulse==='spin'?t*1.5:cell.pulse==='bounce'?Math.sin(t*3)*0.3:0;
        ctx.save();ctx.translate(cx+cs/2,cy+cs/2);ctx.rotate(ang);ctx.scale(scl,scl);ctx.translate(-(cx+cs/2),-(cy+cs/2));
        drawSym(ctx,cell.symbol,cx+cs/2,cy+cs/2,cs,cell.accent,t);
        ctx.restore();
      }
    }

    const p = pieceRef.current;
    if (p&&!goRef.current&&!freezeRef.current&&!pauseRef.current) {
      const g = ghost();
      ctx.globalAlpha = isDarkRef.current ? 0.16 : 0.20;
      for (let y=0;y<p.shape.length;y++) for (let x=0;x<p.shape[y].length;x++) {
        if (!p.shape[y][x]) continue;
        const bx=g.x+x, by=g.y+y;
        if (bx>=0&&bx<BW&&by>=0&&by<BH) { ctx.fillStyle=p.color; ctx.fillRect(bx*cs,by*cs,cs-1,cs-1); }
      }
      ctx.globalAlpha = 1;
      const glowAmt = p.isPowerUp?(10+6*Math.sin(t*2)):(5+3*Math.sin(t));
      ctx.shadowBlur=glowAmt; ctx.shadowColor=p.glow??BRAND; ctx.shadowOffsetY=2;
      for (let y=0;y<p.shape.length;y++) for (let x=0;x<p.shape[y].length;x++) {
        if (!p.shape[y][x]) continue;
        const bx=pxRef.current+x, by=pyRef.current+y;
        if (bx>=0&&bx<BW&&by>=0&&by<BH) {
          ctx.fillStyle=p.color; ctx.fillRect(bx*cs,by*cs,cs-1,cs-1);
          ctx.fillStyle=p.border; ctx.fillRect(bx*cs,by*cs,cs-1,2); ctx.fillRect(bx*cs,by*cs,2,cs-1);
          ctx.fillStyle='rgba(0,0,0,0.2)'; ctx.fillRect(bx*cs,by*cs+cs-3,cs-1,2); ctx.fillRect(bx*cs+cs-3,by*cs,2,cs-1);
        }
      }
      ctx.shadowBlur=0; ctx.shadowOffsetY=0;
      if (p.isPowerUp&&p.symbol&&p.accent&&cs>=10) {
        for (let y=0;y<p.shape.length;y++) for (let x=0;x<p.shape[y].length;x++) {
          if (!p.shape[y][x]) continue;
          const bx=pxRef.current+x, by=pyRef.current+y;
          if (bx>=0&&bx<BW&&by>=0&&by<BH) {
            const scl=p.pulse==='breathe'?0.75+0.25*Math.sin(t*2):1;
            const ang=p.pulse==='spin'?t*1.5:p.pulse==='bounce'?Math.sin(t*3)*0.3:0;
            ctx.save();ctx.translate(bx*cs+cs/2,by*cs+cs/2);ctx.rotate(ang);ctx.scale(scl,scl);ctx.translate(-(bx*cs+cs/2),-(by*cs+cs/2));
            drawSym(ctx,p.symbol,bx*cs+cs/2,by*cs+cs/2,cs,p.accent,t);
            ctx.restore();
          }
        }
      }
    }

    partsRef.current = partsRef.current.filter(pt => pt.life>0);
    for (const pt of partsRef.current) {
      ctx.globalAlpha=pt.life; ctx.fillStyle=pt.color;
      ctx.fillRect(pt.x-pt.size/2, pt.y-pt.size/2, pt.size, pt.size);
      pt.x+=pt.vx; pt.y+=pt.vy; pt.vy+=0.1; pt.life-=0.04;
    }
    ctx.globalAlpha = 1;

    const fill = getCriticalZoneFill(boardRef.current);
    if (fill >= 0.3) {
      const start = Math.floor((BW - CRITICAL_ZONE_SIZE) / 2);
      const intensity = Math.min(0.5, (fill - 0.3) / 0.2);
      ctx.fillStyle = `rgba(255, 68, 0, ${intensity * 0.5})`;
      for (let dy = 0; dy < CRITICAL_ZONE_SIZE; dy++)
        for (let dx = 0; dx < CRITICAL_ZONE_SIZE; dx++)
          ctx.fillRect((start + dx) * cs, (start + dy) * cs, cs, cs);
    }

    const blocksPerLevel = 40;
    const prog = ((linesRef.current % blocksPerLevel) / blocksPerLevel) * cw;
    ctx.fillStyle = T.progressTrack; ctx.fillRect(0,ch-3,cw,3);
    ctx.fillStyle = BRAND; ctx.fillRect(0,ch-3,prog,3);
  }, [ghost]);

  const gameLoop = useCallback((now: number) => {
    if (!playRef.current||goRef.current||pauseRef.current) return;
    pulseRef.current = now * 0.008;
    const delay = getFallMs();
    if (delay!==Infinity && now-lastFallRef.current>=delay) { move(0,1); lastFallRef.current=now; }
    draw();
    rafRef.current = requestAnimationFrame(gameLoop);
  }, [getFallMs, move, draw]);

  const gravLoop = useCallback((now: number) => {
    if (!playRef.current||goRef.current||pauseRef.current||freezeRef.current) {
      gravRaf.current = requestAnimationFrame(gravLoop); return;
    }
    if (now - lastGravRef.current >= 180) {
      const { board: stepped, moved } = stepGrav(boardRef.current, rotRef.current);
      if (moved) {
        const cs = csRef.current;
        const { board: afterAll, totalCleared, allPowerUps } = settleAndClear(stepped, rotRef.current, cs, burst);
        boardRef.current = afterAll;
        if (totalCleared > 0) {
          let m = 1; if (scndRef.current) m*=3; if (doubleRef.current) m*=2;
          scoreRef.current += Math.floor(totalCleared*50*m);
          setUiScore(scoreRef.current);
          for (const pu of allPowerUps) triggerPU(pu.effect, pu.x, pu.y, pu.name);
        }
      }
      lastGravRef.current = now;
    }
    gravRaf.current = requestAnimationFrame(gravLoop);
  }, [burst, triggerPU]);

  const startGame = useCallback(() => {
    cancelAnimationFrame(rafRef.current); cancelAnimationFrame(gravRaf.current);
    boardRef.current=emptyBoard(); scoreRef.current=0; levelRef.current=1;
    linesRef.current=0; comboRef.current=0; pieceRef.current=null;
    freezeRef.current=false; slowRef.current=false; fastRef.current=false;
    shieldRef.current=false; doubleRef.current=false; scndRef.current=false;
    partsRef.current=[]; histRef.current=[]; bpRef.current=0;
    bpLimRef.current=Math.floor(Math.random()*5)+3;
    puAnimsRef.current=[];
    goRef.current=false; pauseRef.current=false; playRef.current=true;
    const rots: Rot[] = [0,90,180,270];
    rotRef.current = rots[Math.floor(Math.random()*4)];
    if (canvasRef.current) canvasRef.current.style.transform=`rotate(${rotRef.current}deg)`;
    if (overlayRef.current) overlayRef.current.style.transform=`rotate(${rotRef.current}deg)`;
    setUiScore(0); setUiLevel(1); setUiLines(0); setUiCombo(0);
    setGameOver(false); setPaused(false); setPuName(''); setBonus('');
    setShowName(false); setIsNewRecord(false); updFlags();
    recalc(); spawn(); setPlaying(true);
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

  useEffect(() => {
    fetch('/api/game-highscores').then(r=>r.json()).then(d=>{if(Array.isArray(d))setGlobalHS(d);}).catch(()=>{});
  }, []);

  const saveHS = async () => {
    if (!pname.trim()||saving) return;
    setSaving(true);
    const entry: LocalHS = { name:pname.trim(), score:finalSc, date:new Date().toLocaleDateString('de-DE') };
    const wasNew = savePersonalBest(entry);
    setPersonalBest(loadPersonalBest());
    setIsNewRecord(wasNew);
    try {
      await fetch('/api/game-highscores', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({playerName:pname,score:finalSc}) });
      const d = await (await fetch('/api/game-highscores')).json();
      if (Array.isArray(d)) setGlobalHS(d);
    } catch {}
    setSaving(false); setShowName(false); setPname('');
  };

  const T = getTheme(isDark);
  const panelStyle = { background:T.panelBg, border:`1px solid ${T.panelBorder}` };
  const activeBadges = [
    { on:flags.freeze, label:'FREEZE', col:'#58D1C6' },
    { on:flags.slow,   label:'SLOW',   col:'#55629B' },
    { on:flags.fast,   label:'FAST',   col:BRAND },
    { on:flags.shield, label:'SHIELD', col:'#E5E0D8' },
    { on:flags.double, label:'2×',     col:'#FFDC71' },
    { on:flags.scnd,   label:'3×',     col:'#FFC27A' },
  ].filter(f => f.on);

  const mbSize = isMobile
    ? Math.min(Math.max(54, Math.floor((typeof window!=='undefined'?window.innerWidth:360)-80)/5), 82)
    : 52;

  return (
    <div style={{background:T.wrapperBg,borderColor:`${BRAND}35`}}
      className="w-full h-screen md:h-auto md:min-h-[600px] md:my-4 rounded-2xl border-2 flex flex-col overflow-hidden transition-colors duration-300">

      <div style={{background:`linear-gradient(90deg,${BRAND_DIM},${BRAND},${BRAND_DIM})`}} className="h-0.5 flex-shrink-0"/>

    <div className="flex-shrink-0 py-1 px-3 text-center flex flex-col items-center">
  {/* Logo Bereich */}
  <div>
    <img 
  src="/scnd-drop-logo.jpg" 
  alt="SCND DROP"
  width={130}
  height={80}
  className="object-contain"
/>
  </div>
  {activeBadges.length>0&&(
    <div className="flex justify-center gap-1 mt-1 flex-wrap">
      {activeBadges.map(f=>(
        <span key={f.label} style={{color:f.col,border:`1px solid ${f.col}55`,background:`${f.col}18`}}
          className="px-1.5 py-0.5 rounded text-[7px] font-bold tracking-widest animate-pulse">{f.label}</span>
      ))}
    </div>
  )}
  {(bonus||puName)&&(
    <div className="mt-0.5 animate-bounce">
      <span style={{color:BRAND,borderColor:`${BRAND}40`}}
        className="inline-block px-2 py-0.5 text-[8px] font-bold tracking-wider border rounded-sm">{puName||bonus}</span>
    </div>
  )}
</div>

      <div className="flex-1 flex flex-col md:flex-row gap-2 px-2 pb-1 min-h-0">

        <div ref={areaRef} className="flex-1 min-h-0 flex items-center justify-center relative">
          <div className="relative" style={{width:csize.w,height:csize.h}}>
            <div className="absolute -inset-1 rounded pointer-events-none"
              style={{boxShadow:`0 0 24px 2px ${BRAND}22`}}/>

            {/* Game canvas */}
            <canvas ref={canvasRef}
              style={{
                display:'block', width:csize.w, height:csize.h,
                transform:`rotate(${rotRef.current}deg)`,
                transition:'transform 0.4s cubic-bezier(0.2,0.9,0.4,1.1)',
                imageRendering:'pixelated',
                border:`2px solid ${BRAND}`, borderRadius:3,
                position:'absolute', top:0, left:0,
              }}
            />

            {/* Power-up animation overlay — sits on top, pointer-events:none */}
            <canvas ref={overlayRef}
              style={{
                display:'block', width:csize.w, height:csize.h,
                transform:`rotate(${rotRef.current}deg)`,
                transition:'transform 0.4s cubic-bezier(0.2,0.9,0.4,1.1)',
                imageRendering:'pixelated',
                borderRadius:3,
                position:'absolute', top:0, left:0,
                pointerEvents:'none',
              }}
            />

            {paused&&!gameOver&&(
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded z-10"
                style={{background:T.overlayBg,backdropFilter:'blur(6px)'}}>
                <div style={{color:BRAND}} className="text-base font-black tracking-[0.3em]">PAUSE</div>
                <OBtn label="WEITER"   onClick={togglePause} bg={BRAND}        fg={T.canvasBg}/>
                <OBtn label="NEUSTART" onClick={startGame}   outline={BRAND}   fg={BRAND}/>
                <OBtn label="AUFGEBEN" onClick={giveUp}      outline="#C45B63" fg="#C45B63"/>
              </div>
            )}
            {!playing&&!gameOver&&(
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded z-10"
                style={{background:T.overlayBg,backdropFilter:'blur(4px)'}}>
                <div style={{color:BRAND,letterSpacing:'0.2em'}} className="text-xl font-black">SCND DROP</div>
                <div style={{color:T.textMuted}} className="text-[9px] text-center px-4">
                  15×15 · Reihen ≥ {CLEAR_MIN} löschen
                </div>
                <OBtn label="START" onClick={startGame} bg={BRAND} fg={T.canvasBg}/>
              </div>
            )}
            {gameOver&&(
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded z-10"
                style={{background:T.overlayBg,backdropFilter:'blur(6px)'}}>
                <div className="font-black text-base tracking-wider">
                  <span style={{color:BRAND}}>GAME</span>
                  <span style={{color:T.textPrimary}}> OVER</span>
                </div>
                <div style={{color:BRAND}} className="text-2xl font-black tabular-nums">{finalSc.toLocaleString()}</div>
                <OBtn label="NEUSTART" onClick={startGame} bg={BRAND} fg={T.canvasBg}/>
              </div>
            )}
          </div>
        </div>

        <div className="flex-shrink-0 flex flex-row md:flex-col gap-2 md:w-40 pb-1">
          <div className="flex-1 md:flex-none rounded p-2" style={panelStyle}>
            <div style={{color:T.textMuted}} className="text-[6px] uppercase tracking-widest text-center mb-0.5">PUNKTE</div>
            <div style={{color:BRAND}} className="text-xl font-black tabular-nums text-center leading-none">
              {(gameOver?finalSc:uiScore).toLocaleString()}
            </div>
            <div className="flex justify-around mt-1.5">
              {([['LVL',uiLevel],['BLK',uiLines],['×',uiCombo]] as [string,number][]).map(([l,v])=>(
                <div key={l} className="text-center">
                  <div style={{color:T.textMuted}} className="text-[5px] uppercase tracking-wider">{l}</div>
                  <div style={{color:T.textPrimary}} className="text-[10px] font-bold">{v}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex-1 md:flex-none rounded overflow-hidden" style={panelStyle}>
            <div className="px-2 pt-2 pb-2" style={{background:isNewRecord?`${BRAND}18`:'transparent',borderBottom:`1px solid ${T.panelBorder}`}}>
              <div className="flex items-center justify-between mb-1">
                <div style={{color:T.textMuted}} className="text-[6px] uppercase tracking-widest">Dein Rekord</div>
                {isNewRecord&&(
                  <span style={{color:'#FFDC71',background:'#FFDC7122',border:'1px solid #FFDC7155'}}
                    className="text-[6px] font-black px-1.5 py-0.5 rounded tracking-wider animate-pulse">★ NEU</span>
                )}
              </div>
              {personalBest?(
                <>
                  <div style={{color:isNewRecord?BRAND:T.textPrimary}}
                    className="text-2xl font-black tabular-nums leading-none tracking-tight">
                    {personalBest.score.toLocaleString()}
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <span style={{color:T.textPrimary}} className="text-[8px] font-bold truncate max-w-[80px]">{personalBest.name}</span>
                    <span style={{color:T.textMuted}} className="text-[7px]">{personalBest.date}</span>
                  </div>
                  {!gameOver&&uiScore>0&&(
                    <div className="mt-1.5">
                      <div className="h-1 rounded-full overflow-hidden" style={{background:T.progressTrack}}>
                        <div className="h-full rounded-full transition-all duration-300"
                          style={{width:`${Math.min(100,Math.round((uiScore/personalBest.score)*100))}%`,background:BRAND}}/>
                      </div>
                      <div style={{color:T.textMuted}} className="text-[5px] mt-0.5 text-right">
                        {Math.round((uiScore/personalBest.score)*100)}% des Rekords
                      </div>
                    </div>
                  )}
                </>
              ):(
                <div style={{color:T.textMuted}} className="text-[8px] italic py-1">Noch kein Eintrag</div>
              )}
            </div>
            <div className="px-2 pt-1.5 pb-2">
              <div style={{color:BRAND}} className="text-[6px] uppercase tracking-widest font-bold mb-1">Global Top 3</div>
              {globalHS.length===0
                ?<div style={{color:T.textMuted}} className="text-[7px] italic text-center">— keine —</div>
                :globalHS.map((hs,i)=>(
                  <div key={i} className="flex justify-between items-center mb-0.5">
                    <span style={{color:BRAND}} className="text-[7px] font-bold mr-0.5">{['I','II','III'][i]}</span>
                    <span style={{color:T.textMuted}} className="text-[7px] flex-1 truncate">{hs.player_name}</span>
                    <span style={{color:T.textPrimary}} className="text-[7px] font-bold tabular-nums">{hs.score.toLocaleString()}</span>
                  </div>
                ))
              }
            </div>
          </div>

          <div className="hidden md:block rounded p-2" style={panelStyle}>
            <div style={{color:T.textMuted}} className="text-[5px] uppercase tracking-widest mb-1">Steuerung</div>
            {([['←→','Seite'],['↓','Fall'],['↑','Dreh'],['ESC','Pause']] as [string,string][]).map(([k,v])=>(
              <div key={k} className="flex justify-between items-center mb-0.5">
                <kbd style={{borderColor:`${BRAND}40`,color:BRAND,background:T.canvasBg}}
                  className="px-1 py-0.5 text-[6px] font-mono border rounded">{k}</kbd>
                <span style={{color:T.textMuted}} className="text-[6px]">{v}</span>
              </div>
            ))}
          </div>

          {playing&&!gameOver&&(
            <button onClick={giveUp}
              style={{borderColor:'#C45B6355',color:'#C45B63AA'}}
              className="hidden md:block rounded py-0.5 text-[7px] font-bold uppercase tracking-widest border hover:opacity-80 transition">
              Aufgeben
            </button>
          )}
        </div>
      </div>

      {playing&&!gameOver&&!paused&&(
        <div style={{background:T.panelBg,borderTopColor:T.panelBorder}}
          className="md:hidden flex-shrink-0 border-t py-3 px-4">
          <div className="flex items-center justify-between w-full max-w-sm mx-auto">
            <div className="flex gap-2">
              <MB label="◀" fn={()=>move(-1,0)} size={mbSize} col={BRAND} bg={T.panelBg}/>
              <MB label="▼" fn={()=>move(0,1)}  size={mbSize} col={BRAND} bg={T.panelBg}/>
              <MB label="▶" fn={()=>move(1,0)}  size={mbSize} col={BRAND} bg={T.panelBg}/>
            </div>
            <div className="flex gap-2">
              <MBCanvas size={mbSize} col={BRAND} bg={T.panelBg} fn={rotPiece} filled
                draw={(ctx,cx,cy,sz)=>{
                  const r=sz*0.28;
                  ctx.strokeStyle=BRAND; ctx.lineWidth=Math.max(2,sz*0.1); ctx.lineCap='round';
                  ctx.beginPath(); ctx.arc(cx,cy,r,Math.PI*0.2,Math.PI*1.8); ctx.stroke();
                  const ax=cx+Math.cos(Math.PI*1.8)*r, ay=cy+Math.sin(Math.PI*1.8)*r;
                  ctx.beginPath(); ctx.moveTo(ax+sz*0.08,ay-sz*0.12); ctx.lineTo(ax,ay); ctx.lineTo(ax+sz*0.14,ay+sz*0.04); ctx.stroke();
                }}/>
              <MBCanvas size={mbSize} col={T.textMuted} bg={T.panelBg} fn={togglePause}
                draw={(ctx,cx,cy,sz)=>drawPauseIcon(ctx,cx,cy,sz,T.textMuted)}/>
            </div>
          </div>
          <div className="flex justify-center mt-1.5">
            <span style={{color:T.textMuted}} className="text-[7px] uppercase tracking-widest">
              LVL {uiLevel} · {Math.round(getFallMsForLevel(uiLevel)/100)/10}s
            </span>
          </div>
        </div>
      )}

      {/* ── Name input modal ── */}
      {showName&&(
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4"
          style={{background:T.overlayBg,backdropFilter:'blur(8px)'}}>
          <div className="rounded-xl p-5 max-w-sm w-full shadow-2xl"
            style={{background:T.panelBg,border:`2px solid ${BRAND}`}}>
            <h3 style={{color:BRAND}} className="text-base font-black tracking-wider mb-0.5">HIGHSCORE</h3>
            <p style={{color:T.textMuted}} className="text-[10px] mb-1">
              {personalBest&&finalSc>personalBest.score?'Neuer persönlicher Rekord!':'Lokal + global gespeichert'}
            </p>
            <p style={{color:T.textMuted}} className="text-xs mb-3">
              Punktzahl: <span style={{color:BRAND}} className="font-black text-base">{finalSc.toLocaleString()}</span>
            </p>
            <input type="text" value={pname}
              onChange={e=>setPname(e.target.value)}
              onKeyDown={e=>e.key==='Enter'&&saveHS()}
              maxLength={15} autoFocus placeholder="DEIN NAME"
              style={{background:T.canvasBg,borderColor:`${BRAND}70`,color:T.textPrimary,outline:'none'}}
              className="w-full p-2.5 border rounded mb-3 text-xs uppercase tracking-wider"
            />
            <div className="flex gap-2">
              <button onClick={saveHS} disabled={saving}
                style={{background:BRAND,color:T.canvasBg}}
                className="flex-1 py-1.5 font-black text-xs uppercase tracking-wider rounded disabled:opacity-50 hover:opacity-90 transition">
                {saving?'…':'SPEICHERN'}
              </button>
              <button onClick={()=>setShowName(false)}
                style={{borderColor:`${T.textMuted}50`,color:T.textMuted}}
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
    <button onTouchStart={e=>{ e.preventDefault(); fn(); }}
      style={{
        width:size, height:size,
        color: filled ? bg : col,
        background: filled ? col : `${col}16`,
        border: `2px solid ${col}${filled?'FF':'60'}`,
        touchAction:'none', userSelect:'none',
        borderRadius: Math.round(size*0.22),
        fontSize: Math.max(12, size*0.38),
        fontWeight: 900, flexShrink: 0,
      }}
      className="flex items-center justify-center active:scale-90 transition-transform select-none">
      {label}
    </button>
  );
}

function MBCanvas({ size, col, bg, fn, draw, filled }: {
  size:number; col:string; bg:string; fn:()=>void;
  draw:(ctx:CanvasRenderingContext2D,cx:number,cy:number,sz:number)=>void;
  filled?:boolean;
}) {
  const cRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = cRef.current; if (!c) return;
    c.width = size; c.height = size;
    const ctx = c.getContext('2d'); if (!ctx) return;
    ctx.clearRect(0, 0, size, size);
    draw(ctx, size/2, size/2, size);
  }, [size, col, bg, draw]);
  return (
    <button onTouchStart={e=>{ e.preventDefault(); fn(); }}
      style={{
        width:size, height:size,
        background: filled ? col : `${col}16`,
        border: `2px solid ${col}${filled?'FF':'60'}`,
        touchAction:'none', userSelect:'none',
        borderRadius: Math.round(size*0.22),
        flexShrink: 0, padding: 0, overflow:'hidden',
      }}
      className="flex items-center justify-center active:scale-90 transition-transform select-none">
      <canvas ref={cRef} style={{ display:'block', width:size, height:size }}/>
    </button>
  );
}
