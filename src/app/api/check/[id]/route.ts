// app/api/vinted/check/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: itemId } = await params;

  try {
    // ─────────────────────────────────────────────────────────
    // 1. HTML-Seite abrufen (wie im AddTab-Scraper)
    // ─────────────────────────────────────────────────────────
    const response = await fetch(`https://www.vinted.de/items/${itemId}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'de-DE,de;q=0.9,en;q=0.8',
        'Referer': 'https://www.vinted.de/',
        'Cache-Control': 'no-cache',
      },
    });

    // ─────────────────────────────────────────────────────────
    // 2. Existenzprüfung (404/410 = gelöscht)
    // ─────────────────────────────────────────────────────────
    if (response.status === 404 || response.status === 410) {
      return NextResponse.json({ exists: false, status: 'deleted' });
    }

    // ─────────────────────────────────────────────────────────
    // 3. Rate‑Limiting / andere HTTP-Fehler
    // ─────────────────────────────────────────────────────────
    if (response.status === 403 || response.status === 429) {
      return NextResponse.json(
        { error: 'Rate limited', exists: true, isSold: false },
        { status: 429 }
      );
    }

    if (!response.ok) {
      return NextResponse.json(
        { error: `HTTP ${response.status}`, exists: true, isSold: false },
        { status: response.status }
      );
    }

    // ─────────────────────────────────────────────────────────
    // 4. HTML analysieren → Verkaufsstatus ermitteln
    // ─────────────────────────────────────────────────────────
    const html = await response.text();

    // Verkaufs-Indikatoren (exakt wie im AddTab-Scraper)
    const soldPatterns = [
      /Dieser Artikel ist bereits verkauft/i,
      /Artikel nicht verfügbar/i,
      /reserviert/i,
      /sold/i,
      /verkauft/i,
      /nicht mehr verfügbar/i,
      /data-testid="item-sold"/i,
      /class="[^"]*item-sold[^"]*"/i,
      /Dieser Artikel ist reserviert/i,
    ];

    let isSold = false;
    for (const pattern of soldPatterns) {
      if (pattern.test(html)) {
        isSold = true;
        break;
      }
    }

    // Optional: Titel aus <title> extrahieren (für Logging)
    let title = '';
    const titleMatch = html.match(/<title>(.*?)<\/title>/);
    if (titleMatch) title = titleMatch[1].replace(' | Vinted', '');

    // ─────────────────────────────────────────────────────────
    // 5. Antwort im erwarteten Format
    // ─────────────────────────────────────────────────────────
    return NextResponse.json({
      exists: true,
      isSold: isSold,
      status: isSold ? 'sold' : 'active',
      title: title,
    });

  } catch (error) {
    console.error('[Check-API] Fehler:', error);
    return NextResponse.json(
      { error: 'Network error', exists: true, isSold: false },
      { status: 500 }
    );
  }
}
