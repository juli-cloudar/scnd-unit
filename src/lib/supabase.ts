// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    db: { schema: 'public' },
    global: {
      // Cache komplett deaktivieren
      fetch: (url, options = {}) => {
        return fetch(url, {
          ...options,
          cache: 'no-store',        // Next.js fetch cache
          next: { revalidate: 0 }, // Next.js App Router
        })
      }
    }
  }
)
