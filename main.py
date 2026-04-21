from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from vinted import VintedClient
import asyncio

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://scnd-unit.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Echter Browser-User-Agent
USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:133.0) Gecko/20100101 Firefox/133.0"

@app.get("/check/{item_id}")
async def check_item(item_id: str):
    vinted_url = f"https://www.vinted.de/items/{item_id}"
    try:
        # Client ohne Header-Parameter erstellen
        client = VintedClient()
        # Manuell den User-Agent in der Session setzen
        client.session.headers.update({"User-Agent": USER_AGENT})
        
        async with client:
            item_details = await client.item_details(url=vinted_url)
            is_sold = item_details.status == 'sold' if hasattr(item_details, 'status') else False
            return {"exists": True, "isSold": is_sold, "status": "sold" if is_sold else "active"}
    except Exception as e:
        print(f"Fehler bei {vinted_url}: {e}")
        # Fallback: Versuche, die HTML-Seite direkt zu laden (ohne die Bibliothek)
        return await fallback_check(item_id)

async def fallback_check(item_id: str):
    """Fallback: Direkter HTTP-Aufruf der Vinted-Seite mit benutzerdefinierten Headers"""
    import aiohttp
    url = f"https://www.vinted.de/items/{item_id}"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:133.0) Gecko/20100101 Firefox/133.0",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "de-DE,de;q=0.9,en;q=0.8",
        "Referer": "https://www.vinted.de/",
    }
    async with aiohttp.ClientSession() as session:
        async with session.get(url, headers=headers, allow_redirects=True) as resp:
            if resp.status == 404 or resp.status == 410:
                return {"exists": False, "isSold": False, "status": "deleted"}
            if resp.status != 200:
                # Unbekannter Fehler – wir nehmen an, dass der Artikel existiert (kein falscher Alarm)
                return {"exists": True, "isSold": False, "status": "active"}
            html = await resp.text()
            is_sold = any(keyword in html for keyword in [
                "item__sold-badge", "Artikel ist verkauft", "sold-badge", "Dieser Artikel ist bereits verkauft"
            ])
            return {"exists": True, "isSold": is_sold, "status": "sold" if is_sold else "active"}
