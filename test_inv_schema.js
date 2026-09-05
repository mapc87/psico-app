import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function check() {
  const { data, error } = await supabase.rpc('get_table_columns_debug', { table_name: 'invitaciones' });
  console.log('RPC result:', data, error);
  // If no RPC, try raw fetch if possible, or just insert and look at error
  const res = await supabase.from('invitaciones').insert({}).select('*');
  console.log('Insert error columns:', res.error);
}
check();
