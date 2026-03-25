// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://vkuwqpgrvwvhvcbmhldk.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZrdXdxcGdydnd2aHZjYm1obGRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyNjIwMjQsImV4cCI6MjA4OTgzODAyNH0.NqDItegqLiycdTYhVhH3m0kGBijYKb514MXEWCsIs7s'

export const supabase = createClient(supabaseUrl, supabaseKey, {
  db: { schema: 'public' },
  global: {
    // 🔧 CACHE-KONFLIKT MIT NEXT.JS APP ROUTER BEHEBEN
    fetch: (url, options = {}) => {
      return fetch(url, {
        ...options,
        cache: 'no-store',        // Browser-Cache deaktivieren
        next: { revalidate: 0 },  // Next.js Server-Cache deaktivieren
      })
    }
  }
})
