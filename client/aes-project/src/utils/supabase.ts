import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Load environment variables
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

// Create a Supabase client
export const supabase =  createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
