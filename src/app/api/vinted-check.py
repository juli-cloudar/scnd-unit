# api/vinted-check.py
from http.server import BaseHTTPRequestHandler
import json
import asyncio
from vinted import VintedClient

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        # URL-Pfad parsen, z. B. /api/vinted-check/1234567890
        path_parts = self.path.split('/')
        if len(path_parts) < 3:
            self.send_response(400)
            self.end_headers()
            return
        
        item_id = path_parts[-1]
        vinted_url = f"https://www.vinted.de/items/{item_id}"
        
        try:
            # asyncio-Event-Loop für VintedClient
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            result = loop.run_until_complete(self.check_item(vinted_url))
            loop.close()
            
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(result).encode())
        except Exception as e:
            self.send_response(500)
            self.end_headers()
            self.wfile.write(json.dumps({"error": str(e)}).encode())
    
    async def check_item(self, url):
        async with VintedClient() as client:
            item = await client.item_details(url=url)
            is_sold = item.status == 'sold' if hasattr(item, 'status') else False
            return {
                "exists": True,
                "isSold": is_sold,
                "status": "sold" if is_sold else "active"
            }
