import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://your-project.supabase.co'; // Found in your Supabase dashboard
const supabaseKey = 'your-anon-key'; // Found in Supabase project settings
export const supabase = createClient(supabaseUrl, supabaseKey);