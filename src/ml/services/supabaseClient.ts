import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from the project root
const envPath = path.join(__dirname, '../../..', '.env');
dotenv.config({ path: envPath });

// Debug: Log environment variables to verify they're loaded
console.log('ML Supabase Client - VITE_SUPABASE_URL:', process.env.VITE_SUPABASE_URL ? 'Loaded' : 'Not found');
console.log('ML Supabase Client - VITE_SUPABASE_PUBLISHABLE_KEY:', process.env.VITE_SUPABASE_PUBLISHABLE_KEY ? 'Loaded' : 'Not found');
console.log('ML Supabase Client - VITE_SUPABASE_SERVICE_ROLE_KEY:', process.env.VITE_SUPABASE_SERVICE_ROLE_KEY ? 'Loaded' : 'Not found (will use publishable key)');
console.log('Env file path:', envPath);

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
// Use service role key if available, otherwise fall back to publishable key
const SUPABASE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error("Missing Supabase environment variables. Define VITE_SUPABASE_URL and either VITE_SUPABASE_SERVICE_ROLE_KEY or VITE_SUPABASE_PUBLISHABLE_KEY in your .env file.");
}

export const supabase = createClient<Database>(
  SUPABASE_URL,
  SUPABASE_KEY,
  {
    auth: {
      storage: typeof window !== 'undefined' ? localStorage : undefined,
      persistSession: typeof window !== 'undefined',
      autoRefreshToken: typeof window !== 'undefined',
      detectSessionInUrl: typeof window !== 'undefined',
      flowType: 'pkce'
    },
    global: {
      headers: {
        'apikey': SUPABASE_KEY
      }
    }
  }
);