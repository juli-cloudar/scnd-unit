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

# Ein echter Browser-User-Agent
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:133.0) Gecko/20100101 Firefox/133.0",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    "Accept-Language": "de-DE,de;q=0.9,en;q=0.8",
}

@app.get("/check/{item_id}")
async def check_item(item_id: str):
    vinted_url = f"https://www.vinted.de/items/{item_id}"
    try:
        # Client mit benutzerdefinierten Headers erstellen
        async with VintedClient(headers=HEADERS) as client:
            item_details = await client.item_details(url=vinted_url)
            is_sold = item_details.status == 'sold' if hasattr(item_details, 'status') else False
            return {"exists": True, "isSold": is_sold, "status": "sold" if is_sold else "active"}
    except Exception as e:
        print(f"Fehler bei {vinted_url}: {e}")
        return {"exists": False, "isSold": False, "status": "deleted"}
