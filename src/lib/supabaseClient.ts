import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let supabase = null;

if (supabaseUrl && supabaseAnonKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
    console.log("Supabase client initialized successfully.");
  } catch (error) {
    console.error("Error initializing Supabase client:", error);
  }
} else {
  console.warn("Supabase URL or Anon Key is missing. Supabase client not initialized. Check .env file or environment variables.");
}

export { supabase }; // Exporta a variável que contém o cliente ou null 