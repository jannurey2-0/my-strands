import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';


const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  throw new Error(
    'Missing Supabase environment variables. Define VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in your .env file.'
  );
}

const getRedirectUrl = (): string => {
  if (import.meta.env.DEV) {
    return `${window.location.origin}/dashboard`;
  }
  return 'https://my-strands.vercel.app/dashboard';
};

type Profile = Database['public']['Tables']['profiles']['Row'];

export const supabase = createClient<Database>(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      storage: localStorage,
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce'
    },
  }
);

export type { Profile };