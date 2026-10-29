/**
 * Highlander Gold & Silver — Centralized Supabase Configuration
 * 
 * Central connection parameters for Highlander Gold & Silver.
 * Contains only the public project URL and publishable (anon) client key.
 * 
 * Security Notice:
 * - This file contains ONLY the public project URL and public anon key.
 * - These values are safe for frontend distribution and are protected by Supabase Row Level Security (RLS).
 * - NEVER place the service_role key, database passwords, or secret credentials in this file.
 */

export const SUPABASE_CONFIG = {
  url: 'https://azibnvfxnsrocmobzswt.supabase.co',
  anonKey: 'sb_publishable_uNLQLczI2qACWRJDxAJTVg_mWyfHUJZ',
  projectRef: 'azibnvfxnsrocmobzswt'
};

export default SUPABASE_CONFIG;
