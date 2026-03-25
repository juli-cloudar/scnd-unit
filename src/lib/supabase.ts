// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    db: { schema: 'public' },
    global: {
      // 🔧 CACHE-KONFLIKT MIT NEXT.JS APP ROUTER BEHEBEN
      fetch: (url, options = {}) => {
        return fetch(url, {
          ...options,
          cache: 'no-store',        // Browser-Cache deaktivieren
          next: { revalidate: 0 }, // Next.js Server-Cache deaktivieren
        })
      }
    }
  }
)
