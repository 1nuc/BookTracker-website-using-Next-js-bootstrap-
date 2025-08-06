// lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl ) {
  throw new Error('Supabase url is missing!')
}
else if(!supabaseAnonKey){
  throw new Error('Supabase service key is missing!')
  
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
