import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://xivorcuooskcqhvevphp.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhpdm9yY3Vvb3NrY3FodmV2cGhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg5NTM1MDIsImV4cCI6MjEwNDUyOTUwMn0.DthnFxvYSdcI-3y6X9_jXhsl2lQNWqEM0SmNLeyDkvU';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
