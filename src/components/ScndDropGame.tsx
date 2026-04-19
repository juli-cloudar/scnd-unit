// src/components/ScndDropGame.tsx – vollständig, mit Distanz-basierter Spawn-Suche
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

const TETROMINOS = [ /* ... unverändert ... */ ];
const POWERUP_TETROMINOS = [ /* ... unverändert ... */ ];
interface Highscore { player_name: string; score: number; }

export function ScndDropGame() {
  // ... alle States (wie gehabt) ...

  // ========== NEUE SPAWN-LOGIK (Distanz-basiert) ==========
  const getSpawnPositionByDistance = (pieceShape: number[][]): { x: number; y: number } | null => {
    if (!canvasRef.current) return null;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const cs = rect.width / BOARD_WIDTH; // aktuelle Pixelgröße einer Zelle
    const targetScreenX = rect.width / 2;
    const targetScreenY = 0;

    // Fixpunkt in Board-Koordinaten (rotationsunabhängig)
    const targetBoard = screenToBoard(targetScreenX, targetScreenY, cs);
    const pieceWidth = pieceShape[0].length;
    const pieceHeight = pieceShape.length;

    let bestX = -1, bestY = -1;
    let bestDist = Infinity;

    // Durchsuche einen Bereich von -3 bis +3 um den Fixpunkt
    for (let dy = -3; dy <= 3; dy++) {
      for (let dx = -3; dx <= 3; dx++) {
        let testX = targetBoard.x + dx;
        let testY = targetBoard.y + dy;
        // Korrektur, damit der Block komplett ins Board passt
        testX = Math.min(Math.max(0, testX), BOARD_WIDTH - pieceWidth);
        testY = Math.min(Math.max(0, testY), BOARD_HEIGHT - pieceHeight);
        if (!collision(pieceShape, testX, testY)) {
          const dist = Math.abs(dx) + Math.abs(dy); // Manhattan-Distanz
          if (dist < bestDist) {
            bestDist = dist;
            bestX = testX;
            bestY = testY;
          }
        }
      }
    }

    if (bestX === -1) return null;
    return { x: bestX, y: bestY };
  };

  // screenToBoard mit aktueller Zellengröße
  const screenToBoard = (screenX: number, screenY: number, cs: number): { x: number; y: number } => {
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

  const spawnNewPiece = () => {
    if (rotationPending) {
      setTimeout(() => spawnNewPiece(), 50); // kurz warten, falls Rotation läuft
      return;
    }
    const isPowerUpSpawn = Math.random() < 0.15;
    const pool = isPowerUpSpawn ? POWERUP_TETROMINOS : TETROMINOS;
    const random = Math.floor(Math.random() * pool.length);
    const piece = JSON.parse(JSON.stringify(pool[random]));
    setCurrentPiece(piece);
    const spawnPos = getSpawnPositionByDistance(piece.shape);
    if (!spawnPos) {
      endGame();
      return;
    }
    setPieceX(spawnPos.x);
    setPieceY(spawnPos.y);
    setGhostFallActive(true);
    setTimeout(() => setGhostFallActive(false), 600);
  };

  // Der Rest des Codes (mergePiece, movePiece, etc.) bleibt exakt gleich
  // ... (alle anderen Funktionen unverändert)

  return ( /* JSX unverändert */ );
}
