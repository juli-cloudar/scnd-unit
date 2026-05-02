// src/lib/supabase-server.ts
// WICHTIG: Diese Datei wird NUR auf dem Server verwendet!
// Keine 'use client' hier!

import { createClient } from '@supabase/supabase-js'

// Diese Variablen sind NUR auf dem Server verfügbar
const supabaseUrl = process.env.SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase server environment variables')
}

export const supabaseServer = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})
