import { createClient } from '@supabase/supabase-js';
import { SUPABASE_CONFIG } from './supabaseConfig';

// Centralized credentials with optional environment override (no .env required)
const supabaseUrl = (import.meta?.env?.VITE_SUPABASE_URL || SUPABASE_CONFIG.url || '').trim();
const supabaseAnonKey = (import.meta?.env?.VITE_SUPABASE_ANON_KEY || SUPABASE_CONFIG.anonKey || '').trim();

// Check if credentials are properly configured
export const isSupabaseConfigured = () => {
  return Boolean(
    supabaseUrl && 
    supabaseAnonKey && 
    supabaseUrl !== '' && 
    supabaseAnonKey !== '' &&
    !supabaseUrl.includes('placeholder') &&
    !supabaseUrl.includes('your-project')
  );
};

// Centralized Supabase singleton client
export const supabase = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;

// Helper to report client status for diagnostics
export const getSupabaseStatus = () => {
  const configured = isSupabaseConfigured();
  return {
    isConfigured: configured,
    url: configured ? supabaseUrl.replace(/^(https:\/\/[^.]+).*/, '$1.supabase.co') : null,
    hasKey: Boolean(supabaseAnonKey),
    statusText: configured ? 'Connected to Supabase' : 'Offline / Development Mode (Ready for Supabase)',
  };
};

export { SUPABASE_CONFIG };
