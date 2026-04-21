from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import httpx

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://scnd-unit.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:133.0) Gecko/20100101 Firefox/133.0"

@app.get("/check/{item_id}")
async def check_item(item_id: str):
    url = f"https://www.vinted.de/items/{item_id}"
    headers = {
        "User-Agent": USER_AGENT,
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "de-DE,de;q=0.9,en;q=0.8",
        "Referer": "https://www.vinted.de/",
    }
    
    async with httpx.AsyncClient(timeout=15.0) as client:
        try:
            resp = await client.get(url, headers=headers, follow_redirects=True)
        except httpx.TimeoutException:
            # Timeout – wir nehmen an, der Artikel existiert (kein falscher Alarm)
            return {"exists": True, "isSold": False, "status": "active"}
        except Exception:
            return {"exists": True, "isSold": False, "status": "active"}

        if resp.status_code == 404 or resp.status_code == 410:
            return {"exists": False, "isSold": False, "status": "deleted"}
        
        if resp.status_code != 200:
            # Unbekannter Fehler – existiert laut Annahme
            return {"exists": True, "isSold": False, "status": "active"}
        
        html = resp.text
        is_sold = any(keyword in html for keyword in [
            "item__sold-badge",
            "Artikel ist verkauft",
            "sold-badge",
            "Dieser Artikel ist bereits verkauft"
        ])
        return {"exists": True, "isSold": is_sold, "status": "sold" if is_sold else "active"}
