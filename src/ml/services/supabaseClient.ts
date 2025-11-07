import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

// In browser environment, use the same environment variables as the main app
// In Node.js environment, load from .env file
let SUPABASE_URL: string | undefined;
let SUPABASE_KEY: string | undefined;

if (isBrowser) {
  // Browser environment - use import.meta.env (Vite) or window.env
  SUPABASE_URL = import.meta.env?.VITE_SUPABASE_URL || (window as any).env?.VITE_SUPABASE_URL;
  // IMPORTANT: Only use publishable key in browser to avoid exposing service role key
  SUPABASE_KEY = import.meta.env?.VITE_SUPABASE_PUBLISHABLE_KEY || 
                 (window as any).env?.VITE_SUPABASE_PUBLISHABLE_KEY;
} else {
  // Node.js environment - try to get from process.env directly
  // Note: dotenv should be loaded at the application entry point, not here
  SUPABASE_URL = process.env.VITE_SUPABASE_URL;
  // Use service role key only in Node.js environment for ML operations
  SUPABASE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
}

if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error("Missing Supabase environment variables. Define VITE_SUPABASE_URL and either VITE_SUPABASE_SERVICE_ROLE_KEY or VITE_SUPABASE_PUBLISHABLE_KEY in your .env file.");
}

// Add validation to ensure service role key is only used in Node.js environment
if (isBrowser && SUPABASE_KEY?.includes('service_role')) {
  console.warn('WARNING: Service role key detected in browser environment. This is a security risk.');
  // Fall back to publishable key if somehow service role key made it to browser
  SUPABASE_KEY = import.meta.env?.VITE_SUPABASE_PUBLISHABLE_KEY || 
                  (window as any).env?.VITE_SUPABASE_PUBLISHABLE_KEY;
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