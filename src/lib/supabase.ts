import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://vkuwqpgrvwvhvcbmhldk.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZrdXdxcGdydnd2aHZjYm1obGRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyNjIwMjQsImV4cCI6MjA4OTgzODAyNH0.NqDItegqLiycdTYhVhH3m0kGBijYKb514MXEWCsIs7s'

// 🔧 FÜR CLIENT COMPONENTS (Admin, UI-Interaktionen)
export const supabase = createClient(supabaseUrl, supabaseKey, {
  db: { schema: 'public' },
  global: {
    fetch: (url, options = {}) => fetch(url, {
      ...options,
      cache: 'no-store',
      next: { revalidate: 0 },
    })
  }
})

// 🔧 FÜR SERVER COMPONENTS (page.tsx mit async/await)
export const supabaseServer = createClient(supabaseUrl, supabaseKey, {
  db: { schema: 'public' },
  global: {
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
    },
    fetch: (url, options = {}) => {
      const timestamp = Date.now()
      const urlWithCacheBust = typeof url === 'string' 
        ? `${url}${url.includes('?') ? '&' : '?'}_t=${timestamp}`
        : url
      
      return fetch(urlWithCacheBust, {
        ...options,
        cache: 'no-store',
        next: { revalidate: 0 },
      })
    }
  }
})
