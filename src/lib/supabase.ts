import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    supabaseUrl &&
      supabaseAnonKey &&
      supabaseUrl.startsWith('https://') &&
      !supabaseUrl.includes('placeholder') &&
      !supabaseUrl.includes('your-supabase-project') &&
      !supabaseAnonKey.includes('your-supabase')
  );
};

// createClient requires a syntactically valid URL even when unconfigured; the
// UI checks isSupabaseConfigured() and blocks auth/data flows with an explicit
// message instead of letting requests fail cryptically.
export const supabase = createClient(
  isSupabaseConfigured() ? supabaseUrl : 'https://unconfigured.invalid',
  isSupabaseConfigured() ? supabaseAnonKey : 'unconfigured',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  }
);
