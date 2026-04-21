from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from vinted import VintedClient
import asyncio

app = FastAPI()

# Erlaube Anfragen von deiner Vercel-App (wichtig für CORS)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://deine-vercel-app.vercel.app"], # Hier deine URL eintragen
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/check/{item_id}")
async def check_item(item_id: str):
    """
    Ruft die Details eines Vinted-Artikels ab und gibt den Verkaufsstatus zurück.
    """
    vinted_url = f"https://www.vinted.de/items/{item_id}"
    try:
        async with VintedClient() as client:
            item_details = await client.item_details(url=vinted_url)
            is_sold = item_details.status == 'sold' if hasattr(item_details, 'status') else False

            return {
                "exists": True,
                "isSold": is_sold,
                "status": "sold" if is_sold else "active",
            }

    except Exception as e:
        # Tritt ein Fehler auf (z.B. 404), behandeln wir es als nicht existent
        print(f"Fehler bei {vinted_url}: {e}")
        return {
            "exists": False,
            "isSold": False,
            "status": "deleted"
        }
